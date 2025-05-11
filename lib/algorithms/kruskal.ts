import type { GraphData, AlgorithmStep } from "../types"

// Kruskal's algorithm for minimum spanning tree
export function runKruskal(graphData: GraphData): AlgorithmStep[] {
  const steps: AlgorithmStep[] = []
  const nodes = graphData.nodes.map((n) => n.id)
  const processOrder: { source: number; target: number; weight: number }[] = [] // Para rastrear a ordem de processamento das arestas

  if (nodes.length === 0) return steps

  // Sort edges by weight
  const sortedEdges = [...graphData.edges].sort((a, b) => a.weight - b.weight)

  // Initialize disjoint set for each node
  const parent: Record<number, number> = {}
  const rank: Record<number, number> = {}
  for (const node of nodes) {
    parent[node] = node
    rank[node] = 0
  }

  // Find function for disjoint set with path compression
  const find = (node: number): number => {
    if (parent[node] !== node) {
      parent[node] = find(parent[node])
    }
    return parent[node]
  }

  // Union function for disjoint set with rank
  const union = (a: number, b: number) => {
    const rootA = find(a)
    const rootB = find(b)

    if (rootA === rootB) return

    if (rank[rootA] < rank[rootB]) {
      parent[rootA] = rootB
    } else if (rank[rootA] > rank[rootB]) {
      parent[rootB] = rootA
    } else {
      parent[rootB] = rootA
      rank[rootA]++
    }
  }

  steps.push({
    description: "Iniciar algoritmo de Kruskal. Ordenar todas as arestas por peso.",
    stats: {
      Algoritmo: "Kruskal - Árvore Geradora Mínima",
      "Total de Arestas": sortedEdges.length,
      "Arestas na AGM": 0,
      "Peso Total": 0,
      "Ordem de Processamento": "",
    },
  })

  const mstEdges: { source: number; target: number }[] = []
  let totalWeight = 0

  for (const edge of sortedEdges) {
    const sourceRoot = find(edge.source)
    const targetRoot = find(edge.target)

    // Adicionar à ordem de processamento
    processOrder.push({ source: edge.source, target: edge.target, weight: edge.weight })
    const processOrderFormatted = processOrder.map((e) => `(${e.source}, ${e.target})`).join(" → ")

    steps.push({
      description: `Considerar aresta (${edge.source}, ${edge.target}) com peso ${edge.weight}.`,
      highlightedNodes: [edge.source, edge.target],
      highlightedEdges: [{ source: edge.source, target: edge.target }],
      stats: {
        Algoritmo: "Kruskal - Árvore Geradora Mínima",
        "Aresta Atual": `(${edge.source}, ${edge.target})`,
        "Peso da Aresta": edge.weight,
        "Arestas na AGM": mstEdges.length,
        "Peso Total": totalWeight,
        "Ordem de Processamento": processOrderFormatted,
      },
    })

    if (sourceRoot !== targetRoot) {
      // Add edge to MST
      mstEdges.push({ source: edge.source, target: edge.target })
      totalWeight += edge.weight
      union(edge.source, edge.target)

      steps.push({
        description: `Adicionar aresta (${edge.source}, ${edge.target}) com peso ${edge.weight} à AGM.`,
        highlightedNodes: [edge.source, edge.target],
        highlightedEdges: [...mstEdges],
        stats: {
          Algoritmo: "Kruskal - Árvore Geradora Mínima",
          "Aresta Adicionada": `(${edge.source}, ${edge.target})`,
          "Peso da Aresta": edge.weight,
          "Arestas na AGM": mstEdges.length,
          "Peso Total": totalWeight,
          "Ordem de Processamento": processOrderFormatted,
        },
      })

      // Check if MST is complete
      if (mstEdges.length === nodes.length - 1) {
        break
      }
    } else {
      steps.push({
        description: `Pular aresta (${edge.source}, ${edge.target}) pois criaria um ciclo.`,
        stats: {
          Algoritmo: "Kruskal - Árvore Geradora Mínima",
          "Aresta Ignorada": `(${edge.source}, ${edge.target})`,
          Motivo: "Criaria ciclo",
          "Arestas na AGM": mstEdges.length,
          "Peso Total": totalWeight,
          "Ordem de Processamento": processOrderFormatted,
        },
      })
    }
  }

  // Final step
  // Identificar nós escolhidos (todos os nós que são parte de alguma aresta na MST)
  const chosenNodesSet = new Set<number>()
  mstEdges.forEach((edge) => {
    chosenNodesSet.add(edge.source)
    chosenNodesSet.add(edge.target)
  })
  const chosenNodes = Array.from(chosenNodesSet)
  const notChosenNodes = nodes.filter((node) => !chosenNodesSet.has(node))

  // Formatar as arestas escolhidas para exibição
  const chosenEdgesFormatted = mstEdges.map((edge) => `${edge.source} → ${edge.target}`).join(", ")

  // Identificar arestas não escolhidas
  const notChosenEdges = graphData.edges.filter(
    (edge) =>
      !mstEdges.some(
        (chosen) =>
          (chosen.source === edge.source && chosen.target === edge.target) ||
          (!edge.directed && chosen.source === edge.target && chosen.target === edge.source),
      ),
  )

  // Formatar as arestas não escolhidas para exibição
  const notChosenEdgesFormatted =
    notChosenEdges.length > 0 ? notChosenEdges.map((edge) => `${edge.source} → ${edge.target}`).join(", ") : "Nenhuma"

  // Formatar a ordem de processamento final
  const processOrderFormatted = processOrder.map((e) => `(${e.source}, ${e.target})`).join(" → ")

  if (mstEdges.length === nodes.length - 1) {
    steps.push({
      description: "Algoritmo concluído. Árvore Geradora Mínima encontrada.",
      highlightedEdges: mstEdges,
      stats: {
        Algoritmo: "Kruskal - Árvore Geradora Mínima",
        Status: "Completo",
        "Arestas na AGM": mstEdges.length,
        "Peso Total": totalWeight,
        "Nós Cobertos": chosenNodes.length,
        "Ordem de Processamento": processOrderFormatted,
        "Nós Escolhidos": chosenNodes.join(", "),
        "Nós Não Escolhidos": notChosenNodes.length > 0 ? notChosenNodes.join(", ") : "Nenhum",
        "Arestas na AGM": chosenEdgesFormatted,
        "Arestas Não Escolhidas": notChosenEdgesFormatted,
      },
    })
  } else {
    steps.push({
      description: "Algoritmo concluído. O grafo não é conectado, então uma AGM completa não pode ser formada.",
      highlightedEdges: mstEdges,
      stats: {
        Algoritmo: "Kruskal - Árvore Geradora Mínima",
        Status: "Incompleto - Grafo não conectado",
        "Arestas na AGM": mstEdges.length,
        "Peso Total": totalWeight,
        "Nós Cobertos": chosenNodes.length,
        "Ordem de Processamento": processOrderFormatted,
        "Nós Escolhidos": chosenNodes.join(", "),
        "Nós Não Escolhidos": notChosenNodes.length > 0 ? notChosenNodes.join(", ") : "Nenhum",
        "Arestas na AGM": chosenEdgesFormatted,
        "Arestas Não Escolhidas": notChosenEdgesFormatted,
      },
    })
  }

  return steps
}
