// Graph data types
export interface Node {
  id: number
  x: number
  y: number
}

export interface Edge {
  source: number
  target: number
  directed: boolean
  weight: number
}

export interface GraphData {
  nodes: Node[]
  edges: Edge[]
}

// Tool types
export type Tool = "node" | "edge" | "move" | "none"

// Algorithm types
export type Algorithm = "dijkstra" | "prim" | "kruskal"

// Algorithm visualization types
export interface AlgorithmStep {
  description: string
  highlightedNodes?: number[]
  visitedNodes?: number[]
  highlightedEdges?: { source: number; target: number }[]
  nodeValues?: Record<number, number>
  stats?: Record<string, string | number>
}
