"use client";

import { useRef, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Node, Edge, GraphData, Tool, AlgorithmStep } from "@/lib/types";

interface GraphCanvasProps {
  graphData: GraphData;
  activeTool: Tool;
  algorithmStep?: AlgorithmStep;
  width?: number;
  height?: number;
  onNodeAdd?: (node: Node) => void;
  onEdgeAdd?: (edge: Edge) => void;
  onNodeMove?: (id: number, x: number, y: number) => void;
  onNodeUpdate?: (id: number, newId: number) => void;
  onEdgeUpdate?: (sourceId: number, targetId: number, weight: number) => void;
  onEdgeSelect?: (sourceId: number, targetId: number, weight: number) => void;
  selectedEdge?: { source: number; target: number; weight: number } | null;
}

export default function GraphCanvas({
  graphData,
  activeTool,
  algorithmStep,
  width = 800,
  height = 500,
  onNodeAdd,
  onEdgeAdd,
  onNodeMove,
  onNodeUpdate,
  onEdgeUpdate,
  onEdgeSelect,
  selectedEdge,
}: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<number | null>(null);
  const [edgeStartNodeId, setEdgeStartNodeId] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [editingNode, setEditingNode] = useState<{
    id: number;
    x: number;
    y: number;
  } | null>(null);
  const [newNodeId, setNewNodeId] = useState<string>("");
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const NODE_RADIUS = 20;
  const EDGE_ARROW_SIZE = 10;

  // Draw the graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // Draw edges
    graphData.edges.forEach((edge) => {
      const sourceNode = graphData.nodes.find((n) => n.id === edge.source);
      const targetNode = graphData.nodes.find((n) => n.id === edge.target);

      if (sourceNode && targetNode) {
        drawEdge(ctx, sourceNode, targetNode, edge, algorithmStep);
      }
    });

    // Draw temporary edge when creating
    if (edgeStartNodeId !== null) {
      const sourceNode = graphData.nodes.find((n) => n.id === edgeStartNodeId);
      if (sourceNode) {
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.strokeStyle = "#888";
        ctx.stroke();
      }
    }

    // Draw nodes
    graphData.nodes.forEach((node) => {
      drawNode(ctx, node, algorithmStep);
    });

    ctx.restore();
  }, [graphData, edgeStartNodeId, mousePos, algorithmStep, scale, offset]);

  // Handle mouse events for zoom and pan
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const newScale = Math.min(Math.max(0.5, scale - e.deltaY * 0.001), 3);
      setScale(newScale);
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect) return;

      // Transform mouse coordinates to account for zoom and pan
      const x = (e.clientX - rect.left - offset.x) / scale;
      const y = (e.clientY - rect.top - offset.y) / scale;

      // Check if clicked on a node
      const clickedNode = graphData.nodes.find(
        (node) =>
          Math.sqrt(Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2)) <
          NODE_RADIUS
      );

      // Check if clicked on an edge
      const clickedEdge = graphData.edges.find((edge) => {
        const sourceNode = graphData.nodes.find((n) => n.id === edge.source);
        const targetNode = graphData.nodes.find((n) => n.id === edge.target);
        if (sourceNode && targetNode) {
          return isPointOnEdge(
            x,
            y,
            sourceNode.x,
            sourceNode.y,
            targetNode.x,
            targetNode.y
          );
        }
        return false;
      });

      // If clicked on empty space, enable panning
      if (!clickedNode && !clickedEdge) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    canvas.addEventListener("wheel", handleWheel);
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [scale, offset, dragStart, isDragging, graphData]);

  const handleMouseDown = (e: MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Transform mouse coordinates to account for zoom and pan
    const x = (e.clientX - rect.left - offset.x) / scale;
    const y = (e.clientY - rect.top - offset.y) / scale;

    // Check if clicked on a node
    const clickedNode = graphData.nodes.find(
      (node) =>
        Math.sqrt(Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2)) <
        NODE_RADIUS
    );

    if (clickedNode) {
      if (activeTool === "move") {
        setDraggedNodeId(clickedNode.id);
      } else if (activeTool === "edge") {
        setEdgeStartNodeId(clickedNode.id);
      } else if (activeTool === "node") {
        // Edit node ID
        setEditingNode({
          id: clickedNode.id,
          x: clickedNode.x,
          y: clickedNode.y,
        });
        setNewNodeId(clickedNode.id.toString());
      }
    } else if (activeTool === "node") {
      // Create a new node
      const nextId =
        graphData.nodes.length > 0
          ? Math.max(...graphData.nodes.map((n) => n.id)) + 1
          : 1;

      if (onNodeAdd) {
        onNodeAdd({ id: nextId, x, y });
      }
    }

    // Check if clicked on an edge
    if (!clickedNode) {
      for (const edge of graphData.edges) {
        const sourceNode = graphData.nodes.find((n) => n.id === edge.source);
        const targetNode = graphData.nodes.find((n) => n.id === edge.target);

        if (sourceNode && targetNode) {
          if (
            isPointOnEdge(
              x,
              y,
              sourceNode.x,
              sourceNode.y,
              targetNode.x,
              targetNode.y
            )
          ) {
            // Select the edge for editing
            if (onEdgeSelect) {
              onEdgeSelect(edge.source, edge.target, edge.weight);
            }
            break;
          }
        }
      }
    }
  };

  // Handle mouse events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      // Transform mouse coordinates to account for zoom and pan
      const x = (e.clientX - rect.left - offset.x) / scale;
      const y = (e.clientY - rect.top - offset.y) / scale;

      setMousePos({ x, y });

      if (draggedNodeId !== null && onNodeMove) {
        onNodeMove(draggedNodeId, x, y);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      // Transform mouse coordinates to account for zoom and pan
      const x = (e.clientX - rect.left - offset.x) / scale;
      const y = (e.clientY - rect.top - offset.y) / scale;

      if (edgeStartNodeId !== null) {
        // Check if released on a node
        const endNode = graphData.nodes.find(
          (node) =>
            Math.sqrt(Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2)) <
            NODE_RADIUS
        );

        if (endNode && endNode.id !== edgeStartNodeId && onEdgeAdd) {
          // Create a new edge
          const isDirected = !e.shiftKey;

          // Check if edge already exists
          const edgeExists = graphData.edges.some(
            (edge) =>
              (edge.source === edgeStartNodeId && edge.target === endNode.id) ||
              (!isDirected &&
                edge.source === endNode.id &&
                edge.target === edgeStartNodeId)
          );

          if (!edgeExists) {
            const newEdge = {
              source: edgeStartNodeId,
              target: endNode.id,
              directed: isDirected,
              weight: 1,
            };

            onEdgeAdd(newEdge);

            // Select the newly created edge
            if (onEdgeSelect) {
              onEdgeSelect(newEdge.source, newEdge.target, newEdge.weight);
            }
          }
        }

        setEdgeStartNodeId(null);
      }

      setDraggedNodeId(null);
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    graphData,
    activeTool,
    draggedNodeId,
    edgeStartNodeId,
    onNodeAdd,
    onEdgeAdd,
    onNodeMove,
    onEdgeSelect,
    scale,
    offset,
  ]);

  const handleNodeIdUpdate = () => {
    if (editingNode && onNodeUpdate) {
      const newId = Number.parseInt(newNodeId);
      if (!isNaN(newId) && newId > 0) {
        // Check if ID is already in use by another node
        const idExists = graphData.nodes.some(
          (node) => node.id === newId && node.id !== editingNode.id
        );

        if (!idExists) {
          onNodeUpdate(editingNode.id, newId);
        }
      }
      setEditingNode(null);
    }
  };

  // Helper function to draw a node
  const drawNode = (
    ctx: CanvasRenderingContext2D,
    node: Node,
    algorithmStep?: AlgorithmStep
  ) => {
    const isHighlighted = algorithmStep?.highlightedNodes?.includes(node.id);
    const isVisited = algorithmStep?.visitedNodes?.includes(node.id);

    ctx.beginPath();
    ctx.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI);

    if (isHighlighted) {
      ctx.fillStyle = "#ff9500";
    } else if (isVisited) {
      ctx.fillStyle = "#90cdf4";
    } else {
      ctx.fillStyle = "#f1f5f9";
    }

    ctx.fill();
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw node ID
    ctx.fillStyle = "#334155";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node.id.toString(), node.x, node.y);

    // Draw distance label if available
    if (
      algorithmStep?.nodeValues &&
      algorithmStep.nodeValues[node.id] !== undefined
    ) {
      const value = algorithmStep.nodeValues[node.id];
      const valueText =
        value === Number.POSITIVE_INFINITY ? "∞" : value.toString();

      ctx.fillStyle = "#1e293b";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(valueText, node.x, node.y + NODE_RADIUS + 15);
    }
  };

  // Helper function to draw an edge
  const drawEdge = (
    ctx: CanvasRenderingContext2D,
    sourceNode: Node,
    targetNode: Node,
    edge: Edge,
    algorithmStep?: AlgorithmStep
  ) => {
    const isHighlighted = algorithmStep?.highlightedEdges?.some(
      (e) =>
        (e.source === edge.source && e.target === edge.target) ||
        (!edge.directed && e.source === edge.target && e.target === edge.source)
    );

    const isSelected = selectedEdge && (
      (selectedEdge.source === edge.source && selectedEdge.target === edge.target) ||
      (!edge.directed && selectedEdge.source === edge.target && selectedEdge.target === edge.source)
    );

    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    const angle = Math.atan2(dy, dx);

    // Calculate start and end points (adjusted for node radius)
    const startX = sourceNode.x + NODE_RADIUS * Math.cos(angle);
    const startY = sourceNode.y + NODE_RADIUS * Math.sin(angle);
    const endX = targetNode.x - NODE_RADIUS * Math.cos(angle);
    const endY = targetNode.y - NODE_RADIUS * Math.sin(angle);

    // Draw the line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);

    if (isHighlighted) {
      ctx.strokeStyle = "#ff9500";
      ctx.lineWidth = 3;
    } else if (isSelected) {
      ctx.strokeStyle = "#3b82f6"; // Blue color for selected edge
      ctx.lineWidth = 3;
    } else {
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 2;
    }

    ctx.stroke();

    // Draw arrow if directed
    if (edge.directed) {
      ctx.beginPath();
      ctx.moveTo(
        endX - EDGE_ARROW_SIZE * Math.cos(angle - Math.PI / 6),
        endY - EDGE_ARROW_SIZE * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(endX, endY);
      ctx.lineTo(
        endX - EDGE_ARROW_SIZE * Math.cos(angle + Math.PI / 6),
        endY - EDGE_ARROW_SIZE * Math.sin(angle + Math.PI / 6)
      );
      ctx.fillStyle = isHighlighted ? "#ff9500" : isSelected ? "#3b82f6" : "#64748b";
      ctx.fill();
    }

    // Draw weight
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    // Add a small background for better readability
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(midX, midY, 12, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = isSelected ? "#3b82f6" : "#334155";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(edge.weight.toString(), midX, midY);
  };

  // Helper function to check if a point is near an edge
  const isPointOnEdge = (
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    threshold = 10
  ) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < threshold;
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border rounded-lg bg-white"
      />

      {editingNode && (
        <div
          className="absolute bg-white p-2 rounded-lg shadow-md border"
          style={{
            left: `${editingNode.x * scale + offset.x + 30}px`,
            top: `${editingNode.y * scale + offset.y}px`,
            zIndex: 10,
          }}
        >
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={newNodeId}
              onChange={(e) => {
                setNewNodeId(e.target.value);
              }}
              className="w-20"
              autoFocus
            />
            <Button size="sm" onClick={handleNodeIdUpdate}>
              Atualizar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditingNode(null)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
