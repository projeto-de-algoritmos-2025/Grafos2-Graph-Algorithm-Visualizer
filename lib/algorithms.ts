import type { GraphData, Algorithm, AlgorithmStep } from "./types"
import { runDijkstra } from "./algorithms/dijkstra"
import { runPrim } from "./algorithms/prim"
import { runKruskal } from "./algorithms/kruskal"

// Main function to run the selected algorithm
export function runAlgorithm(
  algorithm: Algorithm,
  graphData: GraphData,
  sourceNode: number | null,
  targetNode: number | null,
): AlgorithmStep[] {
  switch (algorithm) {
    case "dijkstra":
      return runDijkstra(graphData, sourceNode || 1, targetNode)
    case "prim":
      return runPrim(graphData)
    case "kruskal":
      return runKruskal(graphData)
    default:
      return []
  }
}