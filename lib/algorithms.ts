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
      return runDijkstra(graphData, sourceNode || 1)
    case "prim":
      return runPrim(graphData)
    case "kruskal":
      return runKruskal(graphData)
    default:
      return []
  }
}

// Dijkstra's algorithm for shortest paths
// function runDijkstra(graphData: GraphData, sourceNode: number): AlgorithmStep[] {
//   const steps: AlgorithmStep[] = []
//   const nodes = graphData.nodes.map((n) => n.id)
//   const distances: Record<number, number> = {}
//   const previous: Record<number, number | null> = {}
//   const unvisited = new Set(nodes)

//   // Initialize distances
//   for (const node of nodes) {
//     distances[node] = node === sourceNode ? 0 : Number.POSITIVE_INFINITY
//     previous[node] = null
//   }

//   steps.push({
//     description: `Initialize distances: set distance of source node ${sourceNode} to 0, all others to infinity.`,
//     highlightedNodes: [sourceNode],
//     nodeValues: { ...distances },
//     stats: {
//       Algorithm: "Dijkstra's Shortest Path",
//       "Source Node": sourceNode,
//     },
//   })

//   while (unvisited.size > 0) {
//     // Find the unvisited node with the smallest distance
//     let current: number | null = null
//     let smallestDistance = Number.POSITIVE_INFINITY

//     for (const node of unvisited) {
//       if (distances[node] < smallestDistance) {
//         smallestDistance = distances[node]
//         current = node
//       }
//     }

//     // If we can't find a node or the smallest distance is infinity, we're done
//     if (current === null || distances[current] === Number.POSITIVE_INFINITY) {
//       break
//     }

//     // Mark the current node as visited
//     unvisited.delete(current)

//     // Get all edges from the current node
//     const edges = graphData.edges.filter((e) => e.source === current || (!e.directed && e.target === current))

//     const visitedNodes = nodes.filter((n) => !unvisited.has(n))

//     steps.push({
//       description: `Visit node ${current} with current distance ${distances[current]}.`,
//       highlightedNodes: [current],
//       visitedNodes,
//       nodeValues: { ...distances },
//       stats: {
//         "Current Node": current,
//         Distance: distances[current] === Number.POSITIVE_INFINITY ? "∞" : distances[current],
//         "Visited Nodes": visitedNodes.length,
//         "Remaining Nodes": unvisited.size,
//       },
//     })

//     // Update distances to neighbors
//     for (const edge of edges) {
//       const neighbor = edge.source === current ? edge.target : edge.source

//       if (unvisited.has(neighbor)) {
//         const weight = edge.weight
//         const distanceToNeighbor = distances[current] + weight

//         if (distanceToNeighbor < distances[neighbor]) {
//           distances[neighbor] = distanceToNeighbor
//           previous[neighbor] = current

//           steps.push({
//             description: `Update distance to node ${neighbor} to ${distanceToNeighbor} via node ${current}.`,
//             highlightedNodes: [current, neighbor],
//             visitedNodes,
//             highlightedEdges: [{ source: current, target: neighbor }],
//             nodeValues: { ...distances },
//             stats: {
//               "Current Node": current,
//               Neighbor: neighbor,
//               "New Distance": distanceToNeighbor,
//               "Visited Nodes": visitedNodes.length,
//               "Remaining Nodes": unvisited.size,
//             },
//           })
//         } else {
//           steps.push({
//             description: `No update needed for node ${neighbor} as current path (${distances[neighbor]}) is shorter than new path (${distanceToNeighbor}).`,
//             highlightedNodes: [current, neighbor],
//             visitedNodes,
//             highlightedEdges: [{ source: current, target: neighbor }],
//             nodeValues: { ...distances },
//             stats: {
//               "Current Node": current,
//               Neighbor: neighbor,
//               "Current Distance": distances[neighbor],
//               "New Path Distance": distanceToNeighbor,
//               "Visited Nodes": visitedNodes.length,
//               "Remaining Nodes": unvisited.size,
//             },
//           })
//         }
//       }
//     }
//   }

//   // Reconstruct the shortest paths
//   const shortestPaths: Record<number, number[]> = {}
//   let totalDistance = 0

//   for (const node of nodes) {
//     if (node === sourceNode) continue

//     const path: number[] = []
//     let current: number | null = node

//     while (current !== null) {
//       path.unshift(current)
//       current = previous[current]
//     }

//     if (path.length > 0 && path[0] === sourceNode) {
//       shortestPaths[node] = path
//       totalDistance += distances[node]
//     }
//   }

//   // Final step showing the complete solution
//   const finalEdges: { source: number; target: number }[] = []

//   for (const node in previous) {
//     if (previous[node] !== null) {
//       finalEdges.push({
//         source: previous[node]!,
//         target: Number.parseInt(node),
//       })
//     }
//   }

//   steps.push({
//     description: "Algorithm complete. Final shortest paths from source node are highlighted.",
//     visitedNodes: nodes,
//     highlightedEdges: finalEdges,
//     nodeValues: { ...distances },
//     stats: {
//       Algorithm: "Dijkstra's Shortest Path",
//       "Source Node": sourceNode,
//       "Total Distance": totalDistance,
//       "Reachable Nodes": Object.keys(shortestPaths).length,
//     },
//   })

//   return steps
// }

// Prim's algorithm for minimum spanning tree
// function runPrim(graphData: GraphData): AlgorithmStep[] {
//   const steps: AlgorithmStep[] = []
//   const nodes = graphData.nodes.map((n) => n.id)

//   if (nodes.length === 0) return steps

//   const startNode = nodes[0]
//   const visited = new Set<number>([startNode])
//   const mstEdges: { source: number; target: number }[] = []
//   let totalWeight = 0

//   steps.push({
//     description: `Start Prim's algorithm from node ${startNode}.`,
//     highlightedNodes: [startNode],
//     stats: {
//       Algorithm: "Prim's Minimum Spanning Tree",
//       "Start Node": startNode,
//       "MST Edges": 0,
//       "Total Weight": 0,
//     },
//   })

//   while (visited.size < nodes.length) {
//     let minEdge: { source: number; target: number; weight: number } | null = null

//     // Find the minimum weight edge connecting a visited node to an unvisited node
//     for (const edge of graphData.edges) {
//       const sourceVisited = visited.has(edge.source)
//       const targetVisited = visited.has(edge.target)

//       // One endpoint is visited and the other is not
//       if ((sourceVisited && !targetVisited) || (!edge.directed && !sourceVisited && targetVisited)) {
//         const source = sourceVisited ? edge.source : edge.target
//         const target = sourceVisited ? edge.target : edge.source

//         if (!minEdge || edge.weight < minEdge.weight) {
//           minEdge = { source, target, weight: edge.weight }
//         }
//       }
//     }

//     if (!minEdge) {
//       // Graph is not connected
//       steps.push({
//         description: "Graph is not connected. Cannot complete MST.",
//         visitedNodes: Array.from(visited),
//         highlightedEdges: mstEdges,
//         stats: {
//           Algorithm: "Prim's Minimum Spanning Tree",
//           Status: "Incomplete - Graph not connected",
//           "MST Edges": mstEdges.length,
//           "Total Weight": totalWeight,
//           "Visited Nodes": visited.size,
//           "Unvisited Nodes": nodes.length - visited.size,
//         },
//       })
//       break
//     }

//     // Add the edge to the MST
//     mstEdges.push({ source: minEdge.source, target: minEdge.target })
//     visited.add(minEdge.target)
//     totalWeight += minEdge.weight

//     steps.push({
//       description: `Add edge (${minEdge.source}, ${minEdge.target}) with weight ${minEdge.weight} to the MST.`,
//       highlightedNodes: [minEdge.source, minEdge.target],
//       visitedNodes: Array.from(visited),
//       highlightedEdges: [...mstEdges],
//       stats: {
//         Algorithm: "Prim's Minimum Spanning Tree",
//         "Added Edge": `(${minEdge.source}, ${minEdge.target})`,
//         "Edge Weight": minEdge.weight,
//         "MST Edges": mstEdges.length,
//         "Total Weight": totalWeight,
//         "Visited Nodes": visited.size,
//         "Remaining Nodes": nodes.length - visited.size,
//       },
//     })
//   }

//   // Final step
//   if (visited.size === nodes.length) {
//     steps.push({
//       description: "Algorithm complete. Minimum Spanning Tree found.",
//       visitedNodes: Array.from(visited),
//       highlightedEdges: mstEdges,
//       stats: {
//         Algorithm: "Prim's Minimum Spanning Tree",
//         Status: "Complete",
//         "MST Edges": mstEdges.length,
//         "Total Weight": totalWeight,
//         "Nodes Covered": visited.size,
//       },
//     })
//   }

//   return steps
// }

// Kruskal's algorithm for minimum spanning tree
// function runKruskal(graphData: GraphData): AlgorithmStep[] {
//   const steps: AlgorithmStep[] = []
//   const nodes = graphData.nodes.map((n) => n.id)

//   if (nodes.length === 0) return steps

//   // Sort edges by weight
//   const sortedEdges = [...graphData.edges].sort((a, b) => a.weight - b.weight)

//   // Initialize disjoint set for each node
//   const parent: Record<number, number> = {}
//   for (const node of nodes) {
//     parent[node] = node
//   }

//   // Find function for disjoint set
//   const find = (node: number): number => {
//     if (parent[node] !== node) {
//       parent[node] = find(parent[node])
//     }
//     return parent[node]
//   }

//   // Union function for disjoint set
//   const union = (a: number, b: number) => {
//     parent[find(a)] = find(b)
//   }

//   steps.push({
//     description: "Start Kruskal's algorithm. Sort all edges by weight.",
//     stats: {
//       Algorithm: "Kruskal's Minimum Spanning Tree",
//       "Total Edges": sortedEdges.length,
//       "MST Edges": 0,
//       "Total Weight": 0,
//     },
//   })

//   const mstEdges: { source: number; target: number }[] = []
//   let totalWeight = 0

//   for (const edge of sortedEdges) {
//     const sourceRoot = find(edge.source)
//     const targetRoot = find(edge.target)

//     steps.push({
//       description: `Consider edge (${edge.source}, ${edge.target}) with weight ${edge.weight}.`,
//       highlightedNodes: [edge.source, edge.target],
//       highlightedEdges: [{ source: edge.source, target: edge.target }],
//       stats: {
//         Algorithm: "Kruskal's Minimum Spanning Tree",
//         "Current Edge": `(${edge.source}, ${edge.target})`,
//         "Edge Weight": edge.weight,
//         "MST Edges": mstEdges.length,
//         "Total Weight": totalWeight,
//       },
//     })

//     if (sourceRoot !== targetRoot) {
//       // Add edge to MST
//       mstEdges.push({ source: edge.source, target: edge.target })
//       totalWeight += edge.weight
//       union(edge.source, edge.target)

//       steps.push({
//         description: `Add edge (${edge.source}, ${edge.target}) with weight ${edge.weight} to the MST.`,
//         highlightedNodes: [edge.source, edge.target],
//         highlightedEdges: [...mstEdges],
//         stats: {
//           Algorithm: "Kruskal's Minimum Spanning Tree",
//           "Added Edge": `(${edge.source}, ${edge.target})`,
//           "Edge Weight": edge.weight,
//           "MST Edges": mstEdges.length,
//           "Total Weight": totalWeight,
//         },
//       })

//       // Check if MST is complete
//       if (mstEdges.length === nodes.length - 1) {
//         break
//       }
//     } else {
//       steps.push({
//         description: `Skip edge (${edge.source}, ${edge.target}) as it would create a cycle.`,
//         stats: {
//           Algorithm: "Kruskal's Minimum Spanning Tree",
//           "Skipped Edge": `(${edge.source}, ${edge.target})`,
//           Reason: "Would create cycle",
//           "MST Edges": mstEdges.length,
//           "Total Weight": totalWeight,
//         },
//       })
//     }
//   }

//   // Final step
//   if (mstEdges.length === nodes.length - 1) {
//     steps.push({
//       description: "Algorithm complete. Minimum Spanning Tree found.",
//       highlightedEdges: mstEdges,
//       stats: {
//         Algorithm: "Kruskal's Minimum Spanning Tree",
//         Status: "Complete",
//         "MST Edges": mstEdges.length,
//         "Total Weight": totalWeight,
//         "Nodes Covered": nodes.length,
//       },
//     })
//   } else {
//     steps.push({
//       description: "Algorithm complete. Graph is not connected, so a complete MST cannot be formed.",
//       highlightedEdges: mstEdges,
//       stats: {
//         Algorithm: "Kruskal's Minimum Spanning Tree",
//         Status: "Incomplete - Graph not connected",
//         "MST Edges": mstEdges.length,
//         "Total Weight": totalWeight,
//         "Nodes Covered": new Set(mstEdges.flatMap((e) => [e.source, e.target])).size,
//       },
//     })
//   }

//   return steps
// }

// Strongly Connected Components (Kosaraju's algorithm)
function runSCC(graphData: GraphData): AlgorithmStep[] {
  const steps: AlgorithmStep[] = []
  const nodes = graphData.nodes.map((n) => n.id)

  if (nodes.length === 0) return steps

  // Check if the graph is directed
  const isDirected = graphData.edges.some((e) => e.directed)

  if (!isDirected) {
    steps.push({
      description: "SCC algorithm requires a directed graph. Please create directed edges (without holding Shift).",
      stats: {
        Algorithm: "Strongly Connected Components",
        Status: "Cannot run - Graph is not directed",
      },
    })
    return steps
  }

  // Create adjacency list
  const graph: Record<number, number[]> = {}
  const reverseGraph: Record<number, number[]> = {}

  for (const node of nodes) {
    graph[node] = []
    reverseGraph[node] = []
  }

  for (const edge of graphData.edges) {
    if (edge.directed) {
      graph[edge.source].push(edge.target)
      reverseGraph[edge.target].push(edge.source)
    } else {
      graph[edge.source].push(edge.target)
      graph[edge.target].push(edge.source)
      reverseGraph[edge.target].push(edge.source)
      reverseGraph[edge.source].push(edge.target)
    }
  }

  steps.push({
    description: "Start SCC algorithm. First, perform DFS to get finishing times.",
    stats: {
      Algorithm: "Strongly Connected Components",
      Phase: "First DFS",
      "Components Found": 0,
    },
  })

  // First DFS to get finishing times
  const visited: Record<number, boolean> = {}
  const finishOrder: number[] = []

  for (const node of nodes) {
    visited[node] = false
  }

  const dfs1 = (node: number) => {
    visited[node] = true

    steps.push({
      description: `First DFS: Visit node ${node}.`,
      highlightedNodes: [node],
      visitedNodes: nodes.filter((n) => visited[n]),
      stats: {
        Algorithm: "Strongly Connected Components",
        Phase: "First DFS",
        "Current Node": node,
        "Visited Nodes": nodes.filter((n) => visited[n]).length,
      },
    })

    for (const neighbor of graph[node]) {
      if (!visited[neighbor]) {
        dfs1(neighbor)
      }
    }

    finishOrder.push(node)

    steps.push({
      description: `First DFS: Finish node ${node}, add to finish order.`,
      highlightedNodes: [node],
      visitedNodes: nodes.filter((n) => visited[n]),
      stats: {
        Algorithm: "Strongly Connected Components",
        Phase: "First DFS",
        "Finished Node": node,
        "Finish Order": finishOrder.join(", "),
      },
    })
  }

  for (const node of nodes) {
    if (!visited[node]) {
      dfs1(node)
    }
  }

  steps.push({
    description: "First DFS complete. Now perform second DFS on reversed graph using finish order.",
    stats: {
      Algorithm: "Strongly Connected Components",
      Phase: "Second DFS",
      "Finish Order": finishOrder.join(", "),
      "Components Found": 0,
    },
  })

  // Second DFS to find SCCs
  for (const node of nodes) {
    visited[node] = false
  }

  const components: number[][] = []
  let currentComponent: number[] = []

  const dfs2 = (node: number) => {
    visited[node] = true
    currentComponent.push(node)

    steps.push({
      description: `Second DFS: Visit node ${node}, add to current component.`,
      highlightedNodes: [node],
      visitedNodes: nodes.filter((n) => visited[n]),
      stats: {
        Algorithm: "Strongly Connected Components",
        Phase: "Second DFS",
        "Current Node": node,
        "Current Component": currentComponent.join(", "),
        "Components Found": components.length,
      },
    })

    for (const neighbor of reverseGraph[node]) {
      if (!visited[neighbor]) {
        dfs2(neighbor)
      }
    }
  }

  // Process nodes in reverse finishing order
  for (let i = finishOrder.length - 1; i >= 0; i--) {
    const node = finishOrder[i]
    if (!visited[node]) {
      currentComponent = []
      dfs2(node)
      components.push([...currentComponent])

      steps.push({
        description: `Found SCC: ${currentComponent.join(", ")}`,
        highlightedNodes: currentComponent,
        visitedNodes: nodes.filter((n) => visited[n]),
        stats: {
          Algorithm: "Strongly Connected Components",
          "New Component": currentComponent.join(", "),
          "Components Found": components.length,
          "Nodes Covered": nodes.filter((n) => visited[n]).length,
        },
      })
    }
  }

  // Final step
  steps.push({
    description: `Algorithm complete. Found ${components.length} strongly connected components.`,
    stats: {
      Algorithm: "Strongly Connected Components",
      Status: "Complete",
      "Components Found": components.length,
      Components: components.map((comp) => comp.join(", ")).join(" | "),
    },
  })

  return steps
}
