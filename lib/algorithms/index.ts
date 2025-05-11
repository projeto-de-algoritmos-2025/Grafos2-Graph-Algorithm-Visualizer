import type { GraphData, Algorithm, AlgorithmStep } from "../types"
import { runDijkstra } from "./dijkstra"
import { runPrim } from "./prim"
import { runKruskal } from "./kruskal"

// Main function to run the selected algorithm
export function runAlgorithm(
  algorithm: Algorithm,
  graphData: GraphData,
  sourceNode: number | null,
  targetNode: number | null,
): AlgorithmStep[] {
  // Garantir que graphData tem as propriedades necessárias
  if (!graphData || !graphData.nodes || !graphData.edges) {
    return []
  }

  // Verificar se há nós no grafo
  if (graphData.nodes.length === 0) {
    return [
      {
        description: "O grafo não possui nós. Adicione nós para executar o algoritmo.",
        stats: {
          Algoritmo:
            algorithm === "dijkstra"
              ? "Dijkstra - Caminho Mínimo"
              : algorithm === "prim"
                ? "Prim - Árvore Geradora Mínima"
                : "Kruskal - Árvore Geradora Mínima",
          Status: "Erro - Grafo vazio",
        },
      },
    ]
  }

  switch (algorithm) {
    case "dijkstra":
      // Dijkstra precisa de nó de origem
      if (sourceNode === null) {
        return [
          {
            description: "O algoritmo de Dijkstra precisa de um nó de origem. Selecione um nó de origem.",
            stats: {
              Algoritmo: "Dijkstra - Caminho Mínimo",
              Status: "Erro - Nó de origem não selecionado",
            },
          },
        ]
      }

      // Verificar se o nó de destino existe no grafo
      if (targetNode !== null && !graphData.nodes.some((node) => node.id === targetNode)) {
        return [
          {
            description: `O nó de destino ${targetNode} não existe no grafo.`,
            stats: {
              Algoritmo: "Dijkstra - Caminho Mínimo",
              Status: "Erro - Nó de destino inválido",
              "Nó de Origem": sourceNode,
              "Nó de Destino": targetNode,
            },
          },
        ]
      }

      return runDijkstra(graphData, sourceNode, targetNode)

    case "prim":
      // Prim precisa de nó inicial
      if (sourceNode === null) {
        return [
          {
            description: "O algoritmo de Prim precisa de um nó inicial. Selecione um nó de origem.",
            stats: {
              Algoritmo: "Prim - Árvore Geradora Mínima",
              Status: "Erro - Nó inicial não selecionado",
            },
          },
        ]
      }
      return runPrim(graphData, sourceNode)

    case "kruskal":
      // Kruskal não precisa de nós específicos
      return runKruskal(graphData)

    default:
      return [
        {
          description: "Algoritmo não reconhecido.",
          stats: {
            Status: "Erro - Algoritmo inválido",
          },
        },
      ]
  }
}
