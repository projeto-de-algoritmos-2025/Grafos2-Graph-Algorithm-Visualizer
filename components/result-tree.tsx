"use client"

import { useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { GraphData, AlgorithmStep, Algorithm } from "@/lib/types"

interface ResultTreeProps {
  algorithmStep: AlgorithmStep
  graphData: GraphData
  algorithm: Algorithm | string
  sourceNode: number | null
  finalStep: AlgorithmStep
}

export default function ResultTree({ algorithmStep, graphData, algorithm, sourceNode, finalStep }: ResultTreeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const NODE_RADIUS = 20
  const EDGE_ARROW_SIZE = 10

  // Draw the result tree
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Get highlighted edges from the final step for the result tree
    const resultEdges = finalStep?.highlightedEdges || []

    // Collect all nodes that are part of the result path
    const nodesInPath = new Set<number>()
    resultEdges.forEach((edge) => {
      nodesInPath.add(edge.source)
      nodesInPath.add(edge.target)
    })

    // If we have highlighted nodes in the final step, use those instead
    if (finalStep?.highlightedNodes && finalStep.highlightedNodes.length > 0) {
      finalStep.highlightedNodes.forEach((nodeId) => nodesInPath.add(nodeId))
    }

    // Draw only the edges that are part of the result
    resultEdges.forEach((edge) => {
      const sourceNode = graphData.nodes.find((n) => n.id === edge.source)
      const targetNode = graphData.nodes.find((n) => n.id === edge.target)

      if (sourceNode && targetNode) {
        // Find the original edge to get its properties
        const originalEdge = graphData.edges.find(
          (e) =>
            (e.source === edge.source && e.target === edge.target) ||
            (!e.directed && e.source === edge.target && e.target === edge.source),
        )

        if (originalEdge) {
          drawEdge(ctx, sourceNode, targetNode, originalEdge, true)
        }
      }
    })

    // Draw nodes based on algorithm type
    graphData.nodes.forEach((node) => {
      const isHighlighted = algorithmStep?.highlightedNodes?.includes(node.id) || false
      const isVisited = algorithmStep?.visitedNodes?.includes(node.id) || false
      const isInResult = nodesInPath.has(node.id)
      const isSource = node.id === sourceNode

      // Determine if we should draw this node
      const shouldDraw = true // Mostrar todos os nós, mas com estilos diferentes

      // Desenhar o nó com o estilo apropriado
      drawNode(ctx, node, isHighlighted, isVisited, isInResult, isSource)
    })

    // Draw title
    ctx.fillStyle = "#1e293b"
    ctx.font = "16px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    ctx.fillText("Árvore Resultante", canvas.width / 2, 10)

    // Após desenhar o grafo, adicionar uma legenda
    const legendX = 20
    let legendY = canvas.height - 140

    // Título da legenda
    ctx.fillStyle = "#1e293b"
    ctx.font = "14px sans-serif"
    ctx.textAlign = "left"
    ctx.textBaseline = "middle"
    ctx.fillText("Legenda:", legendX, legendY)
    legendY += 20

    // Nó de origem
    ctx.beginPath()
    ctx.arc(legendX + 10, legendY, 8, 0, 2 * Math.PI)
    ctx.fillStyle = "#3b82f6"
    ctx.fill()
    ctx.strokeStyle = "#334155"
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.fillStyle = "#1e293b"
    ctx.fillText("Nó de origem", legendX + 25, legendY)
    legendY += 20

    // Nós no caminho
    ctx.beginPath()
    ctx.arc(legendX + 10, legendY, 8, 0, 2 * Math.PI)
    ctx.fillStyle = "#22c55e"
    ctx.fill()
    ctx.strokeStyle = "#166534"
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = "#1e293b"
    ctx.fillText("Nós no caminho", legendX + 25, legendY)
    legendY += 20

    // Nós não escolhidos
    ctx.beginPath()
    ctx.arc(legendX + 10, legendY, 8, 0, 2 * Math.PI)
    ctx.fillStyle = "#f1f5f9"
    ctx.fill()
    ctx.strokeStyle = "#94a3b8"
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.fillStyle = "#1e293b"
    ctx.fillText("Nós não escolhidos", legendX + 25, legendY)
    legendY += 20

    // Arestas no caminho
    ctx.beginPath()
    ctx.moveTo(legendX, legendY)
    ctx.lineTo(legendX + 20, legendY)
    ctx.strokeStyle = "#22c55e"
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.fillStyle = "#1e293b"
    ctx.fillText("Arestas no caminho", legendX + 25, legendY)
    legendY += 20

    // Arestas não escolhidas
    ctx.beginPath()
    ctx.moveTo(legendX, legendY)
    ctx.lineTo(legendX + 20, legendY)
    ctx.strokeStyle = "#94a3b8"
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.fillStyle = "#1e293b"
    ctx.fillText("Arestas não escolhidas", legendX + 25, legendY)
  }, [algorithmStep, graphData, finalStep, algorithm, sourceNode])

  // Helper function to draw a node
  const drawNode = (
    ctx: CanvasRenderingContext2D,
    node: { id: number; x: number; y: number },
    isHighlighted: boolean,
    isVisited: boolean,
    isInResult: boolean,
    isSource: boolean,
  ) => {
    ctx.beginPath()
    ctx.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI)

    if (isSource) {
      ctx.fillStyle = "#3b82f6" // Blue for source node
    } else if (isHighlighted && isInResult) {
      ctx.fillStyle = "#22c55e" // Green for highlighted nodes in result
    } else if (isHighlighted) {
      ctx.fillStyle = "#ff9500" // Orange for highlighted nodes
    } else if (isInResult) {
      ctx.fillStyle = "#bbf7d0" // Light green for nodes in result
    } else if (isVisited) {
      ctx.fillStyle = "#90cdf4" // Light blue for visited nodes
    } else {
      ctx.fillStyle = "#f1f5f9" // Default color for nodes not in result
    }

    ctx.fill()

    // Adicionar borda mais grossa para nós no caminho final
    if (isInResult) {
      ctx.strokeStyle = "#166534" // Dark green for result nodes
      ctx.lineWidth = 3
    } else {
      ctx.strokeStyle = "#94a3b8" // Lighter border for non-result nodes
      ctx.lineWidth = 1
    }
    ctx.stroke()

    // Draw node ID
    ctx.fillStyle = isInResult ? "#334155" : "#94a3b8" // Darker text for result nodes, lighter for others
    ctx.font = "14px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(node.id.toString(), node.x, node.y)

    // Draw distance label if available
    if (algorithmStep?.nodeValues && algorithmStep.nodeValues[node.id] !== undefined) {
      const value = algorithmStep.nodeValues[node.id]
      const valueText = value === Number.POSITIVE_INFINITY ? "∞" : value.toString()

      ctx.fillStyle = isInResult ? "#1e293b" : "#94a3b8"
      ctx.font = "12px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(valueText, node.x, node.y + NODE_RADIUS + 15)
    }
  }

  // Helper function to draw an edge
  const drawEdge = (
    ctx: CanvasRenderingContext2D,
    sourceNode: { id: number; x: number; y: number },
    targetNode: { id: number; x: number; y: number },
    edge: { directed: boolean; weight: number },
    isInResult: boolean,
  ) => {
    const dx = targetNode.x - sourceNode.x
    const dy = targetNode.y - sourceNode.y
    const angle = Math.atan2(dy, dx)

    // Calculate start and end points (adjusted for node radius)
    const startX = sourceNode.x + NODE_RADIUS * Math.cos(angle)
    const startY = sourceNode.y + NODE_RADIUS * Math.sin(angle)
    const endX = targetNode.x - NODE_RADIUS * Math.cos(angle)
    const endY = targetNode.y - NODE_RADIUS * Math.sin(angle)

    // Draw the line
    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, endY)

    if (isInResult) {
      ctx.strokeStyle = "#22c55e" // Green for result edges
      ctx.lineWidth = 4 // Mais grosso para arestas no resultado
    } else {
      ctx.strokeStyle = "#94a3b8" // Lighter color for non-result edges
      ctx.lineWidth = 1
    }

    ctx.stroke()

    // Draw arrow if directed
    if (edge.directed) {
      ctx.beginPath()
      ctx.moveTo(
        endX - EDGE_ARROW_SIZE * Math.cos(angle - Math.PI / 6),
        endY - EDGE_ARROW_SIZE * Math.sin(angle - Math.PI / 6),
      )
      ctx.lineTo(endX, endY)
      ctx.lineTo(
        endX - EDGE_ARROW_SIZE * Math.cos(angle + Math.PI / 6),
        endY - EDGE_ARROW_SIZE * Math.sin(angle + Math.PI / 6),
      )
      ctx.fillStyle = isInResult ? "#22c55e" : "#94a3b8"
      ctx.fill()
    }

    // Draw weight
    const midX = (startX + endX) / 2
    const midY = (startY + endY) / 2

    // Add a small background for better readability
    ctx.fillStyle = "white"
    ctx.beginPath()
    ctx.arc(midX, midY, 12, 0, 2 * Math.PI)
    ctx.fill()

    ctx.fillStyle = isInResult ? "#166534" : "#94a3b8"
    ctx.font = "12px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(edge.weight.toString(), midX, midY)
  }

  // Determinar o título com base no algoritmo
  const getTitle = () => {
    if (algorithm === "dijkstra") {
      return "Caminho Mínimo"
    } else if (algorithm === "prim" || algorithm === "kruskal") {
      return "Árvore Geradora Mínima"
    } else {
      return "Resultado do Algoritmo"
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle>{getTitle()}</CardTitle>
      </CardHeader>
      <CardContent>
        <canvas ref={canvasRef} width={500} height={500} className="border rounded-lg bg-white" />
      </CardContent>
    </Card>
  )
}
