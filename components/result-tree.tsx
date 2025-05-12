import { useRef, useEffect, useState } from "react"
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
  const containerRef = useRef<HTMLDivElement>(null)

  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const NODE_RADIUS = 20
  const EDGE_ARROW_SIZE = 10

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.save()
    ctx.translate(offset.x, offset.y)
    ctx.scale(scale, scale)

    const resultEdges = finalStep?.highlightedEdges || []
    const nodesInPath = new Set<number>()
    resultEdges.forEach((edge) => {
      nodesInPath.add(edge.source)
      nodesInPath.add(edge.target)
    })

    if (finalStep?.highlightedNodes && finalStep.highlightedNodes.length > 0) {
      finalStep.highlightedNodes.forEach((nodeId) => nodesInPath.add(nodeId))
    }

    resultEdges.forEach((edge) => {
      const sourceNode = graphData.nodes.find((n) => n.id === edge.source)
      const targetNode = graphData.nodes.find((n) => n.id === edge.target)
      const originalEdge = graphData.edges.find(
        (e) =>
          (e.source === edge.source && e.target === edge.target) ||
          (!e.directed && e.source === edge.target && e.target === edge.source)
      )
      if (sourceNode && targetNode && originalEdge) {
        drawEdge(ctx, sourceNode, targetNode, originalEdge, true)
      }
    })

    graphData.nodes.forEach((node) => {
      const isHighlighted = algorithmStep?.highlightedNodes?.includes(node.id) || false
      const isVisited = algorithmStep?.visitedNodes?.includes(node.id) || false
      const isInResult = nodesInPath.has(node.id)
      const isSource = node.id === sourceNode
      drawNode(ctx, node, isHighlighted, isVisited, isInResult, isSource)
    })

    ctx.restore()

    drawLegend(ctx, canvas.width, canvas.height)
  }, [algorithmStep, graphData, finalStep, algorithm, sourceNode, scale, offset])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const newScale = Math.min(Math.max(0.5, scale - e.deltaY * 0.001), 3)
      setScale(newScale)
    }

    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true)
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
      }
    }

    const handleMouseUp = () => setIsDragging(false)

    canvas.addEventListener("wheel", handleWheel)
    canvas.addEventListener("mousedown", handleMouseDown)
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      canvas.removeEventListener("wheel", handleWheel)
      canvas.removeEventListener("mousedown", handleMouseDown)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [scale, offset, dragStart, isDragging])

  const drawNode = (ctx: CanvasRenderingContext2D, node: any, isHighlighted: boolean, isVisited: boolean, isInResult: boolean, isSource: boolean) => {
    ctx.beginPath()
    ctx.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI)
    ctx.fillStyle = isSource ? "#3b82f6" : isHighlighted && isInResult ? "#22c55e" : isHighlighted ? "#ff9500" : isInResult ? "#bbf7d0" : isVisited ? "#90cdf4" : "#f1f5f9"
    ctx.fill()
    ctx.strokeStyle = isInResult ? "#166534" : "#94a3b8"
    ctx.lineWidth = isInResult ? 3 : 1
    ctx.stroke()
    ctx.fillStyle = isInResult ? "#334155" : "#94a3b8"
    ctx.font = "14px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(node.id.toString(), node.x, node.y)
    if (algorithmStep?.nodeValues && algorithmStep.nodeValues[node.id] !== undefined) {
      const value = algorithmStep.nodeValues[node.id]
      ctx.fillStyle = isInResult ? "#1e293b" : "#94a3b8"
      ctx.font = "12px sans-serif"
      ctx.fillText(value === Infinity ? "∞" : value.toString(), node.x, node.y + NODE_RADIUS + 15)
    }
  }

  const drawEdge = (ctx: CanvasRenderingContext2D, sourceNode: any, targetNode: any, edge: any, isInResult: boolean) => {
    const dx = targetNode.x - sourceNode.x
    const dy = targetNode.y - sourceNode.y
    const angle = Math.atan2(dy, dx)
    const startX = sourceNode.x + NODE_RADIUS * Math.cos(angle)
    const startY = sourceNode.y + NODE_RADIUS * Math.sin(angle)
    const endX = targetNode.x - NODE_RADIUS * Math.cos(angle)
    const endY = targetNode.y - NODE_RADIUS * Math.sin(angle)
    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, endY)
    ctx.strokeStyle = isInResult ? "#22c55e" : "#94a3b8"
    ctx.lineWidth = isInResult ? 4 : 1
    ctx.stroke()
    if (edge.directed) {
      ctx.beginPath()
      ctx.moveTo(
        endX - EDGE_ARROW_SIZE * Math.cos(angle - Math.PI / 6),
        endY - EDGE_ARROW_SIZE * Math.sin(angle - Math.PI / 6)
      )
      ctx.lineTo(endX, endY)
      ctx.lineTo(
        endX - EDGE_ARROW_SIZE * Math.cos(angle + Math.PI / 6),
        endY - EDGE_ARROW_SIZE * Math.sin(angle + Math.PI / 6)
      )
      ctx.fillStyle = isInResult ? "#22c55e" : "#94a3b8"
      ctx.fill()
    }
    const midX = (startX + endX) / 2
    const midY = (startY + endY) / 2
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

  const drawLegend = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const legendX = 20
    let legendY = height - 140
    ctx.fillStyle = "#1e293b"
    ctx.font = "14px sans-serif"
    ctx.textAlign = "left"
    ctx.textBaseline = "middle"
    ctx.fillText("Legenda:", legendX, legendY)
    legendY += 20
    const drawLegendCircle = (color: string, border: string, label: string) => {
      ctx.beginPath()
      ctx.arc(legendX + 10, legendY, 8, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = border
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.fillStyle = "#1e293b"
      ctx.fillText(label, legendX + 25, legendY)
      legendY += 20
    }
    drawLegendCircle("#3b82f6", "#334155", "Nó de origem")
    drawLegendCircle("#22c55e", "#166534", "Nós no caminho")
    drawLegendCircle("#f1f5f9", "#94a3b8", "Nós não escolhidos")

    const drawLegendLine = (color: string, width: number, label: string) => {
      ctx.beginPath()
      ctx.moveTo(legendX, legendY)
      ctx.lineTo(legendX + 20, legendY)
      ctx.strokeStyle = color
      ctx.lineWidth = width
      ctx.stroke()
      ctx.fillStyle = "#1e293b"
      ctx.fillText(label, legendX + 25, legendY)
      legendY += 20
    }
    drawLegendLine("#22c55e", 3, "Arestas no caminho")
    drawLegendLine("#94a3b8", 1, "Arestas não escolhidas")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{algorithm === "dijkstra" ? "Caminho Mínimo" : "Árvore Resultante"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="relative w-full h-[600px]">
          <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
        </div>
      </CardContent>
    </Card>
  )
}