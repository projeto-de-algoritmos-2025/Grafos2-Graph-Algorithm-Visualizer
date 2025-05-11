"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Circle, ArrowRight, Move, Undo2, Redo2, Play, Pause, SkipBack, SkipForward, X, Trash2 } from "lucide-react"
import GraphCanvas from "@/components/graph-canvas"
import type { Node, Edge, GraphData, Tool, Algorithm, AlgorithmStep } from "@/lib/types"
import { runAlgorithm } from "@/lib/algorithms"
import ResultTree from "@/components/result-tree"

export default function GraphVisualizer() {
  const [activeTool, setActiveTool] = useState<Tool>("node")
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    edges: [],
  })
  const [history, setHistory] = useState<GraphData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm | null>(null)
  const [sourceNode, setSourceNode] = useState<number | null>(null)
  const [targetNode, setTargetNode] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [animationSpeed, setAnimationSpeed] = useState(50)
  const [currentStep, setCurrentStep] = useState(0)
  const [algorithmSteps, setAlgorithmSteps] = useState<AlgorithmStep[]>([])
  const [selectedEdge, setSelectedEdge] = useState<{ source: number; target: number; weight: number } | null>(null)

  // Add to history when graph changes
  useEffect(() => {
    if (graphData.nodes.length > 0 || graphData.edges.length > 0) {
      // Only add to history if it's a new state
      if (historyIndex === history.length - 1) {
        setHistory([...history.slice(0, historyIndex + 1), JSON.parse(JSON.stringify(graphData))])
        setHistoryIndex(historyIndex + 1)
      }
    }
  }, [graphData])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "n" || e.key === "N") {
        setActiveTool("node")
      } else if (e.key === "e" || e.key === "E") {
        setActiveTool("edge")
      } else if (e.key === "m" || e.key === "M") {
        setActiveTool("move")
      } else if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
        handleUndo()
      } else if (e.key === "y" && (e.ctrlKey || e.metaKey)) {
        handleRedo()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [history, historyIndex])

  // Animation loop for algorithm visualization
  useEffect(() => {
    let animationTimer: NodeJS.Timeout | null = null

    if (isPlaying && algorithmSteps.length > 0 && currentStep < algorithmSteps.length - 1) {
      animationTimer = setTimeout(
        () => {
          setCurrentStep((prev) => prev + 1)
        },
        1000 - animationSpeed * 9,
      )
    } else if (currentStep >= algorithmSteps.length - 1) {
      setIsPlaying(false)
    }

    return () => {
      if (animationTimer) clearTimeout(animationTimer)
    }
  }, [isPlaying, currentStep, algorithmSteps, animationSpeed])

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setGraphData(JSON.parse(JSON.stringify(history[historyIndex - 1])))
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setGraphData(JSON.parse(JSON.stringify(history[historyIndex + 1])))
    }
  }

  const handleNodeAdd = (node: Node) => {
    setGraphData((prev) => ({
      ...prev,
      nodes: [...prev.nodes, node],
    }))
  }

  const handleEdgeAdd = (edge: Edge) => {
    setGraphData((prev) => ({
      ...prev,
      edges: [...prev.edges, edge],
    }))
  }

  const handleNodeMove = (id: number, x: number, y: number) => {
    setGraphData((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node) => (node.id === id ? { ...node, x, y } : node)),
    }))
  }

  const handleNodeUpdate = (id: number, newId: number) => {
    // Update node ID
    setGraphData((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node) => (node.id === id ? { ...node, id: newId } : node)),
      // Also update edges that reference this node
      edges: prev.edges.map((edge) => ({
        ...edge,
        source: edge.source === id ? newId : edge.source,
        target: edge.target === id ? newId : edge.target,
      })),
    }))
  }

  const handleEdgeUpdate = (sourceId: number, targetId: number, weight: number) => {
    setGraphData((prev) => ({
      ...prev,
      edges: prev.edges.map((edge) =>
        (edge.source === sourceId && edge.target === targetId) ||
        (!edge.directed && edge.source === targetId && edge.target === sourceId)
          ? { ...edge, weight }
          : edge,
      ),
    }))
  }

  const handleEdgeSelect = (sourceId: number, targetId: number, weight: number) => {
    setSelectedEdge({ source: sourceId, target: targetId, weight })
  }

  const updateSelectedEdgeWeight = (weightStr: string) => {
    if (selectedEdge) {
      const weight = Number.parseFloat(weightStr)
      if (!isNaN(weight) && weight > 0) {
        handleEdgeUpdate(selectedEdge.source, selectedEdge.target, weight)
        setSelectedEdge({ ...selectedEdge, weight })
      }
    }
  }

  // Modificar apenas a parte que executa o algoritmo para garantir que os parâmetros corretos sejam passados
  const handleRunAlgorithm = () => {
    if (!selectedAlgorithm) return

    // Verificar se o algoritmo precisa de nó de origem
    if ((selectedAlgorithm === "dijkstra" || selectedAlgorithm === "prim") && sourceNode === null) {
      // Se não tiver nó de origem e precisar, não executar
      return
    }

    // Para Dijkstra, verificar se o nó de destino é válido quando especificado
    if (selectedAlgorithm === "dijkstra" && targetNode !== null) {
      if (!graphData.nodes.some((node) => node.id === targetNode)) {
        // Nó de destino inválido
        return
      }
    }

    // Garantir que targetNode seja null ou number, nunca string
    const targetNodeValue = targetNode === null ? null : Number(targetNode)

    const steps = runAlgorithm(selectedAlgorithm, graphData, sourceNode, targetNodeValue)
    setAlgorithmSteps(steps)
    setCurrentStep(0)
    setIsPlaying(false)
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const nextStep = () => {
    if (currentStep < algorithmSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const clearResults = () => {
    setAlgorithmSteps([])
    setCurrentStep(0)
    setIsPlaying(false)
  }

  const clearGraph = () => {
    setGraphData({
      nodes: [],
      edges: [],
    })
    setHistory([])
    setHistoryIndex(-1)
    clearResults()
    setSelectedEdge(null)
  }

  // Verificar se o algoritmo precisa de nó de origem
  const needsSourceNode = selectedAlgorithm === "dijkstra" || selectedAlgorithm === "prim"

  // Verificar se o algoritmo pode usar nó de destino
  const canUseTargetNode = selectedAlgorithm === "dijkstra"

  return (
    <div className="w-full max-w-7xl">
      <div className="flex flex-col gap-4">
        {/* Barra de ferramentas */}
        <div className="flex flex-wrap gap-2 items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === "node" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setActiveTool("node")}
                >
                  <Circle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ferramenta Nó (N)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === "edge" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setActiveTool("edge")}
                >
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ferramenta Aresta (E)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === "move" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setActiveTool("move")}
                >
                  <Move className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ferramenta Mover (M)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleUndo} disabled={historyIndex <= 0}>
                  <Undo2 className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Desfazer (Ctrl+Z)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                >
                  <Redo2 className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refazer (Ctrl+Y)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={clearResults} disabled={algorithmSteps.length === 0}>
                  <X className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Limpar Resultados</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={clearGraph}
                  disabled={graphData.nodes.length === 0 && graphData.edges.length === 0}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Limpar Grafo</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Edge Weight Editor - Always reserve space */}
        <div className="h-12">
          {selectedEdge && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <span className="text-sm font-medium">Peso da Aresta:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={selectedEdge.weight}
                  onChange={(e) => updateSelectedEdgeWeight(e.target.value)}
                  className="w-20 h-8 px-2 border rounded"
                />
                <span className="text-sm text-muted-foreground">
                  Aresta: {selectedEdge.source} → {selectedEdge.target}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedEdge(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-4">
            <div className="border rounded-lg overflow-hidden bg-background">
              <GraphCanvas
                graphData={graphData}
                activeTool={activeTool}
                onNodeAdd={handleNodeAdd}
                onEdgeAdd={handleEdgeAdd}
                onNodeMove={handleNodeMove}
                onNodeUpdate={handleNodeUpdate}
                onEdgeUpdate={handleEdgeUpdate}
                onEdgeSelect={handleEdgeSelect}
                algorithmStep={algorithmSteps[currentStep]}
                width={500}
                height={500}
              />
            </div>

            {/* Barra de controle de algoritmo - Agora com largura total e controles fixos */}
            <Card className="w-full">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4">
                  {/* Primeira linha: seleção de algoritmo e nós */}
                  <div className="flex flex-wrap gap-2 items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        value={selectedAlgorithm || ""}
                        onValueChange={(value) => {
                          setSelectedAlgorithm(value as Algorithm)
                          // Limpar resultados ao mudar de algoritmo
                          clearResults()
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Selecionar Algoritmo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dijkstra">Dijkstra</SelectItem>
                          <SelectItem value="prim">Prim</SelectItem>
                          <SelectItem value="kruskal">Kruskal</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Seletor de nó de origem - visível para Dijkstra e Prim */}
                      <div className={`flex items-center gap-2 ${needsSourceNode ? "opacity-100" : "opacity-50"}`}>
                        <Label htmlFor="source-node">Origem:</Label>
                        <Select
                          value={sourceNode?.toString() || ""}
                          onValueChange={(value) => setSourceNode(Number.parseInt(value))}
                          disabled={!needsSourceNode || graphData.nodes.length === 0}
                        >
                          <SelectTrigger className="w-[80px]">
                            <SelectValue placeholder="Origem" />
                          </SelectTrigger>
                          <SelectContent>
                            {graphData.nodes.map((node) => (
                              <SelectItem key={node.id} value={node.id.toString()}>
                                {node.id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Seletor de nó de destino - visível apenas para Dijkstra */}
                      <div className={`flex items-center gap-2 ${canUseTargetNode ? "opacity-100" : "opacity-50"}`}>
                        <Label htmlFor="target-node">Destino:</Label>
                        <Select
                          value={targetNode?.toString() || ""}
                          onValueChange={(value) => {
                            // Limpar resultados ao mudar o nó de destino
                            clearResults()
                            setTargetNode(value === "none" ? null : Number(value))
                          }}
                          disabled={!canUseTargetNode || graphData.nodes.length === 0}
                        >
                          <SelectTrigger className="w-[80px]">
                            <SelectValue placeholder="Destino" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhum</SelectItem>
                            {graphData.nodes.map((node) => (
                              <SelectItem key={node.id} value={node.id.toString()}>
                                {node.id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        onClick={handleRunAlgorithm}
                        disabled={
                          !selectedAlgorithm || graphData.nodes.length === 0 || (needsSourceNode && sourceNode === null)
                        }
                      >
                        Executar Algoritmo
                      </Button>
                    </div>

                    {/* Controles de reprodução - sempre visíveis */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={prevStep}
                        disabled={algorithmSteps.length === 0 || currentStep <= 0}
                      >
                        <SkipBack className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={togglePlay}
                        disabled={algorithmSteps.length === 0 || currentStep >= algorithmSteps.length - 1}
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={nextStep}
                        disabled={algorithmSteps.length === 0 || currentStep >= algorithmSteps.length - 1}
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Segunda linha: controle de velocidade (visível apenas quando há passos) */}
                  {algorithmSteps.length > 0 && (
                    <div className="flex items-center gap-4">
                      <span className="text-sm">Velocidade:</span>
                      <Slider
                        value={[animationSpeed]}
                        min={1}
                        max={100}
                        step={1}
                        onValueChange={(value) => setAnimationSpeed(value[0])}
                        className="flex-1"
                      />
                    </div>
                  )}

                  {/* Terceira linha: descrição do passo atual (visível apenas quando há passos) */}
                  {algorithmSteps.length > 0 && algorithmSteps[currentStep] && (
                    <div className="text-sm p-2 bg-muted rounded-md">
                      <div className="font-medium mb-1">
                        Passo {currentStep + 1} de {algorithmSteps.length}
                      </div>
                      {algorithmSteps[currentStep]?.description}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            {algorithmSteps.length > 0 && algorithmSteps[currentStep] ? (
              <ResultTree
                algorithmStep={algorithmSteps[currentStep]}
                graphData={graphData}
                algorithm={selectedAlgorithm || ""}
                sourceNode={sourceNode}
                finalStep={algorithmSteps[algorithmSteps.length - 1]}
              />
            ) : (
              <div className="border rounded-lg bg-background p-8 flex items-center justify-center h-[500px]">
                <div className="text-center text-muted-foreground">
                  <h3 className="text-lg font-medium mb-2">Sem Resultados</h3>
                  <p>Selecione um algoritmo e execute-o para ver os resultados aqui</p>
                </div>
              </div>
            )}

            {algorithmSteps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Resultados do Algoritmo</CardTitle>
                  <CardDescription>Estatísticas da execução do algoritmo</CardDescription>
                </CardHeader>
                <CardContent>
                  {algorithmSteps.length > 0 && algorithmSteps[currentStep]?.stats ? (
                    <div className="space-y-2">
                      {Object.entries(algorithmSteps[currentStep].stats).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground">{key}:</span>
                          <span>{value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <p>Nenhuma estatística disponível</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
