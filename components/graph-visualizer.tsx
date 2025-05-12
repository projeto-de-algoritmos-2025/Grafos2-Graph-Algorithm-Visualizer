"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Circle,
  ArrowRight,
  Move,
  Undo2,
  Redo2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Trash2,
  Minus
} from "lucide-react";
import GraphCanvas from "@/components/graph-canvas";
import type {
  Node,
  Edge,
  GraphData,
  Tool,
  Algorithm,
  AlgorithmStep,
} from "@/lib/types";
import { runAlgorithm } from "@/lib/algorithms";
import ResultTree from "@/components/result-tree";
import { Download, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function GraphVisualizer() {
  const [activeTool, setActiveTool] = useState<Tool>("node");
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    edges: [],
  });
  const [history, setHistory] = useState<GraphData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm | null>(
    null
  );
  const [sourceNode, setSourceNode] = useState<number | null>(null);
  const [targetNode, setTargetNode] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(50);
  const [currentStep, setCurrentStep] = useState(0);
  const [algorithmSteps, setAlgorithmSteps] = useState<AlgorithmStep[]>([]);
  const [selectedEdge, setSelectedEdge] = useState<{
    source: number;
    target: number;
    weight: number;
  } | null>(null);
  
  const weightInputRef = useRef<HTMLInputElement | null>(null);
  const [inputWeight, setInputWeight] = useState<string>(
    selectedEdge?.weight.toString() || ""
  );
  const [showWeightDialog, setShowWeightDialog] = useState(false);
  const [dialogContent, setDialogContent] = useState({ title: "", description: "" });
  const [hasSelectedArrow, setHasSelectedArrow] = useState(false);
  const [isDirected, setIsDirected] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);



  useEffect(() => {
    if (graphData.nodes.length > 0 || graphData.edges.length > 0) {
      if (historyIndex === history.length - 1) {
        setHistory([
          ...history.slice(0, historyIndex + 1),
          JSON.parse(JSON.stringify(graphData)),
        ]);
        setHistoryIndex(historyIndex + 1);
      }
    }
  }, [graphData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "n" || e.key === "N") {
        setActiveTool("node");
      } else if (e.key === "e" || e.key === "E") {
        setActiveTool("edge");
      } else if (e.key === "m" || e.key === "M") {
        setActiveTool("move");
      } else if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
        handleUndo();
      } else if (e.key === "y" && (e.ctrlKey || e.metaKey)) {
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [history, historyIndex]);

  useEffect(() => {
    let animationTimer: NodeJS.Timeout | null = null;

    if (
      isPlaying &&
      algorithmSteps.length > 0 &&
      currentStep < algorithmSteps.length - 1
    ) {
      animationTimer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 1000 - animationSpeed * 9);
    } else if (currentStep >= algorithmSteps.length - 1) {
      setIsPlaying(false);
    }

    return () => {
      if (animationTimer) clearTimeout(animationTimer);
    };
  }, [isPlaying, currentStep, algorithmSteps, animationSpeed]);

    useEffect(() => {
    if (selectedEdge && weightInputRef.current) {
      weightInputRef.current.focus();
    }
  }, [selectedEdge]);

useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const scaleAmount = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(transform.scale + scaleAmount, 0.5), 2); // Clamp between 0.5 and 2

    setTransform((prev) => ({
      ...prev,
      scale: newScale,
    }));
  };

  const handleMouseDown = (e: MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !dragStart) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setTransform((prev) => ({ ...prev, x: newX, y: newY }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  canvas.addEventListener("wheel", handleWheel, { passive: false });
  canvas.addEventListener("mousedown", handleMouseDown);
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);

  return () => {
    canvas.removeEventListener("wheel", handleWheel);
    canvas.removeEventListener("mousedown", handleMouseDown);
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };
}, [transform, isDragging, dragStart]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setGraphData(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setGraphData(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  };

  const handleNodeAdd = (node: Node) => {
    setGraphData((prev) => ({
      ...prev,
      nodes: [...prev.nodes, node],
    }));
  };

  const handleEdgeAdd = (edge: Edge) => {
    if (isDirected) {
      setGraphData(prev => ({
        ...prev,
        edges: [...prev.edges, { ...edge, directed: true }],
      }));
    } else {
      const undirected = { ...edge, directed: false };
      const reverse = {
        source: edge.target,
        target: edge.source,
        weight: edge.weight,
        directed: false,
      };
      setGraphData(prev => ({
        ...prev,
        edges: [...prev.edges, undirected, reverse],
      }));
    }
  };

  const handleNodeMove = (id: number, x: number, y: number) => {
    setGraphData((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node) =>
        node.id === id ? { ...node, x, y } : node
      ),
    }));
  };

  const handleNodeUpdate = (id: number, newId: number) => {
    setGraphData((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node) =>
        node.id === id ? { ...node, id: newId } : node
      ),
      edges: prev.edges.map((edge) => ({
        ...edge,
        source: edge.source === id ? newId : edge.source,
        target: edge.target === id ? newId : edge.target,
      })),
    }));
  };

  const handleEdgeUpdate = (
    sourceId: number,
    targetId: number,
    weight: number
  ) => {
    setGraphData((prev) => ({
      ...prev,
      edges: prev.edges.map((edge) =>
        (edge.source === sourceId && edge.target === targetId) ||
        (!edge.directed && edge.source === targetId && edge.target === sourceId)
          ? { ...edge, weight }
          : edge
      ),
    }));
  };

  const handleEdgeSelect = (
    sourceId: number,
    targetId: number,
    weight: number
  ) => {
    setSelectedEdge({ source: sourceId, target: targetId, weight });
    setInputWeight(weight.toString());
  };

  const updateSelectedEdgeWeight = (weightStr: string) => {
    if (selectedEdge) {
      const weight = Number.parseFloat(weightStr);
      if (!isNaN(weight) && weight > 0) {
        handleEdgeUpdate(selectedEdge.source, selectedEdge.target, weight);
        setSelectedEdge({ ...selectedEdge, weight });
      }
    }
  };

  const handleRunAlgorithm = () => {
    if (!selectedAlgorithm) return;

    if (
      (selectedAlgorithm === "dijkstra" || selectedAlgorithm === "prim") &&
      sourceNode === null
    ) {
      return;
    }

    if (selectedAlgorithm === "dijkstra" && targetNode !== null) {
      if (!graphData.nodes.some((node) => node.id === targetNode)) {
        return;
      }
    }

    const targetNodeValue = targetNode === null ? null : Number(targetNode);

    const steps = runAlgorithm(
      selectedAlgorithm,
      graphData,
      sourceNode,
      targetNodeValue
    );

    const hasUndirectedEdge = graphData.edges.some(edge => !edge.directed);
      if (selectedAlgorithm === "dijkstra" && hasUndirectedEdge) {
        const invalidEdge = graphData.edges.find(edge => !edge.directed);
        if (invalidEdge) {
          setDialogContent({
            title: "Aresta não-direcionada",
            description: `A aresta entre ${invalidEdge.source} e ${invalidEdge.target} não é direcionada. O algoritmo de Dijkstra requer grafos direcionados.`,
          });
          setShowWeightDialog(true); // Reutiliza o mesmo Dialog
          return;
        }
      }

    setAlgorithmSteps(steps);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const nextStep = () => {
    if (currentStep < algorithmSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const clearResults = () => {
    setAlgorithmSteps([]);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const clearGraph = () => {
    setGraphData({
      nodes: [],
      edges: [],
    });
    setHistory([]);
    setHistoryIndex(-1);
    clearResults();
    setSelectedEdge(null);
  };

  const handleExportGraph = () => {
    const dataStr = JSON.stringify(graphData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = window.URL.createObjectURL(dataBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `graph-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleImportGraph = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          const importedData: GraphData = JSON.parse(result);

          if (
            !Array.isArray(importedData.nodes) ||
            !Array.isArray(importedData.edges)
          ) {
            throw new Error("Formato de arquivo inválido");
          }

          setGraphData(importedData);
          setHistory([JSON.parse(JSON.stringify(importedData))]);
          setHistoryIndex(0);
          clearResults();
          setSelectedEdge(null);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      alert("Erro ao importar arquivo: " + (error as Error).message);
    } finally {
      event.target.value = "";
    }
  };
  const needsSourceNode =
    selectedAlgorithm === "dijkstra" || selectedAlgorithm === "prim";

  const canUseTargetNode = selectedAlgorithm === "dijkstra";

  return (
    <div className="w-full max-w-7xl">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2 items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool && activeTool === "node" ? "default" : "outline"}
                  size="icon"
                  onClick={() => {
                      setActiveTool("node");
                      setHasSelectedArrow(false);
                    }}
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
                  variant={hasSelectedArrow && !isDirected ? "default" : "outline"}
                  size="icon"
                  onClick={() => {
                    setActiveTool("edge");
                    setIsDirected(false);
                    setHasSelectedArrow(true);
                  }}
                                >
                  <Minus   className="h-5 w-5 rotate-180" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Aresta Não-Direcional</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={hasSelectedArrow && isDirected ? "default" : "outline"}
                  size="icon"
                  onClick={() => {
                      setActiveTool("edge");
                      setIsDirected(true);
                      setHasSelectedArrow(true);
                    }}
                >
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Aresta Direcional</p>
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
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                >
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
                <Button
                  variant="outline"
                  size="icon"
                  onClick={clearResults}
                  disabled={algorithmSteps.length === 0}
                >
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
                  disabled={
                    graphData.nodes.length === 0 && graphData.edges.length === 0
                  }
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Limpar Grafo</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleExportGraph}
                  disabled={
                    graphData.nodes.length === 0 && graphData.edges.length === 0
                  }
                >
                  <Download className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Exportar Grafo</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <input
                    type="file"
                    id="import-graph"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportGraph}
                  />
                  <Button variant="outline" size="icon" asChild>
                    <label htmlFor="import-graph">
                      <Upload className="h-5 w-5 cursor-pointer" />
                    </label>
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Importar Grafo</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="h-12">
          {selectedEdge && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <span className="text-sm font-medium">Peso da Aresta:</span>
              <div className="flex items-center gap-2">
                {/* <input
                  ref={weightInputRef}
                  type="number"
                  step="0.1"
                  value={inputWeight}
                  onFocus={() => setInputWeight("")}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setInputWeight(newValue);
                    
                    const num = parseFloat(newValue);
                    if (!isNaN(num) && num > 0) {
                      updateSelectedEdgeWeight(newValue);
                      setShowWeightDialog(false);
                    }
                  }}
                  onBlur={(e) => {
                    const value = e.target.value;
                    const num = parseFloat(value);
                    
                    if (!isNaN(num) && num > 0) {
                      updateSelectedEdgeWeight(value);
                      setShowWeightDialog(false);
                    } else {
                      setInputWeight(selectedEdge?.weight.toString() || "");
                      setShowWeightDialog(true);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      weightInputRef.current?.blur(); 
                    }
                  }}
                  className="w-20 h-8 px-2 border rounded"
                /> */}
                <input
                  ref={weightInputRef}
                  type="number"
                  step="0.1"
                  value={inputWeight}
                  onFocus={() => setInputWeight("")} 
                  onChange={(e) => setInputWeight(e.target.value)} 
                  onBlur={(e) => {
                    const value = e.target.value;
                    const num = parseFloat(value);
                    
                    if (value === "") {
                      // Se vazio, restaura o valor original
                      setInputWeight(selectedEdge.weight.toString());
                    } else if (!isNaN(num) && num > 0) {
                      // Se válido, salva
                      updateSelectedEdgeWeight(value);
                    } else {
                      // Se inválido, mostra erro e restaura
                      setShowWeightDialog(true);
                      setInputWeight(selectedEdge.weight.toString());
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const value = inputWeight;
                      const num = parseFloat(value);
                      
                      if (value === "") {
                        setInputWeight(selectedEdge.weight.toString());
                      } else if (!isNaN(num) && num > 0) {
                        updateSelectedEdgeWeight(value);
                        weightInputRef.current?.blur();
                      } else {
                        setShowWeightDialog(true);
                        setInputWeight(selectedEdge.weight.toString());
                      }
                    }
                  }}
                  className="w-20 h-8 px-2 border rounded"
                />
                <Dialog
                  open={showWeightDialog}
                  onOpenChange={setShowWeightDialog}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Valor inválido</DialogTitle>
                      <DialogDescription>
                        O peso da aresta deve ser um número maior que zero.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button onClick={() => setShowWeightDialog(false)}>
                        Entendi
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>


                <span className="text-sm text-muted-foreground">
                  Aresta: {selectedEdge.source} → {selectedEdge.target}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEdge(null)}
                >
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
                  activeTool={activeTool ?? "node"}
                  onNodeAdd={handleNodeAdd}
                  onEdgeAdd={handleEdgeAdd}
                  onNodeMove={handleNodeMove}
                  onNodeUpdate={handleNodeUpdate}
                  onEdgeUpdate={handleEdgeUpdate}
                  onEdgeSelect={(source, target, weight) => {
                    handleEdgeSelect(source, target, weight);
                    setSelectedNode(null);
                  }}
                  algorithmStep={algorithmSteps[currentStep]}
                  width={500}
                  height={500}
                />
              </div>


            <Card className="w-full">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-2 items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        value={selectedAlgorithm || ""}
                        onValueChange={(value) => {
                          setSelectedAlgorithm(value as Algorithm);
                          clearResults();
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

                      <div
                        className={`flex items-center gap-2 ${
                          needsSourceNode ? "opacity-100" : "opacity-50"
                        }`}
                      >
                        <Label htmlFor="source-node">Origem:</Label>
                        <Select
                          value={sourceNode?.toString() || ""}
                          onValueChange={(value) =>
                            setSourceNode(Number.parseInt(value))
                          }
                          disabled={
                            !needsSourceNode || graphData.nodes.length === 0
                          }
                        >
                          <SelectTrigger className="w-[80px]">
                            <SelectValue placeholder="Origem" />
                          </SelectTrigger>
                          <SelectContent>
                            {graphData.nodes.map((node) => (
                              <SelectItem
                                key={node.id}
                                value={node.id.toString()}
                              >
                                {node.id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div
                        className={`flex items-center gap-2 ${
                          canUseTargetNode ? "opacity-100" : "opacity-50"
                        }`}
                      >
                        <Label htmlFor="target-node">Destino:</Label>
                        <Select
                          value={targetNode?.toString() || ""}
                          onValueChange={(value) => {
                            clearResults();
                            setTargetNode(
                              value === "none" ? null : Number(value)
                            );
                          }}
                          disabled={
                            !canUseTargetNode || graphData.nodes.length === 0
                          }
                        >
                          <SelectTrigger className="w-[80px]">
                            <SelectValue placeholder="Destino" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhum</SelectItem>
                            {graphData.nodes.map((node) => (
                              <SelectItem
                                key={node.id}
                                value={node.id.toString()}
                              >
                                {node.id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        onClick={handleRunAlgorithm}
                        disabled={
                          !selectedAlgorithm ||
                          graphData.nodes.length === 0 ||
                          (needsSourceNode && sourceNode === null)
                        }
                      >
                        Executar Algoritmo
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={prevStep}
                        disabled={
                          algorithmSteps.length === 0 || currentStep <= 0
                        }
                      >
                        <SkipBack className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={togglePlay}
                        disabled={
                          algorithmSteps.length === 0 ||
                          currentStep >= algorithmSteps.length - 1
                        }
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={nextStep}
                        disabled={
                          algorithmSteps.length === 0 ||
                          currentStep >= algorithmSteps.length - 1
                        }
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

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
                  <p>
                    Selecione um algoritmo e execute-o para ver os resultados
                    aqui
                  </p>
                </div>
              </div>
            )}

            {algorithmSteps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Resultados do Algoritmo</CardTitle>
                  <CardDescription>
                    Estatísticas da execução do algoritmo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {algorithmSteps.length > 0 &&
                  algorithmSteps[currentStep]?.stats ? (
                    <div className="space-y-2">
                      {Object.entries(algorithmSteps[currentStep].stats).map(
                        ([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground">
                              {key}:
                            </span>
                            <span>{value}</span>
                          </div>
                        )
                      )}
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
  );
}
