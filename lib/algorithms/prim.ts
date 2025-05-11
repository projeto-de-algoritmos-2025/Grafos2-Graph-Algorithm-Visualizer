import type { GraphData, AlgorithmStep } from "../types"

// Prim's algorithm for minimum spanning tree
export function runPrim(graphData: GraphData, startNode?: number | null): AlgorithmStep[] {
  const steps: AlgorithmStep[] = []
  const nodes = graphData.nodes.map((n) => n.id)
  const visitOrder: number[] = [] // Para rastrear a ordem de visita dos nós

  if (nodes.length === 0) return steps

  // Se um nó inicial for fornecido, use-o; caso contrário, use o primeiro nó
  const initialNode = startNode !== null && startNode !== undefined ? startNode : nodes[0]

  // Verificar se o nó inicial existe no grafo
  if (!nodes.includes(initialNode)) {
    steps.push({
      description: `Erro: O nó inicial ${initialNode} não existe no grafo.`,
      stats: {
        Algoritmo: "Prim - Árvore Geradora Mínima",
        Status: "Erro - Nó inicial inválido",
      },
    })
    return steps
  }

  const visited = new Set<number>([initialNode])
  visitOrder.push(initialNode) // Adicionar o nó inicial à ordem de visita
  const mstEdges: { source: number; target: number }[] = []
  let totalWeight = 0

  steps.push({
    description: `Iniciar algoritmo de Prim a partir do nó ${initialNode}.`,
    highlightedNodes: [initialNode],
    visitedNodes: [initialNode],
    stats: {
      Algoritmo: "Prim - Árvore Geradora Mínima",
      "Nó Inicial": initialNode,
      "Arestas na AGM": 0,
      "Peso Total": 0,
      "Ordem de Visita": initialNode.toString(),
    },
  })

  while (visited.size < nodes.length) {
    let minEdge: { source: number; target: number; weight: number } | null = null

    // Find the minimum weight edge connecting a visited node to an unvisited node
    for (const edge of graphData.edges) {
      const sourceVisited = visited.has(edge.source)
      const targetVisited = visited.has(edge.target)

      // One endpoint is visited and the other is not
      if ((sourceVisited && !targetVisited) || (!edge.directed && !sourceVisited && targetVisited)) {
        const source = sourceVisited ? edge.source : edge.target
        const target = sourceVisited ? edge.target : edge.source
        const weight = edge.weight

        if (!minEdge || weight < minEdge.weight) {
          minEdge = { source, target, weight }
        }
      }
    }

    if (!minEdge) {
      // Graph is not connected
      // Identificar nós e arestas escolhidos e não escolhidos
      const chosenNodes = Array.from(visited)
      const notChosenNodes = nodes.filter((node) => !visited.has(node))

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
        notChosenEdges.length > 0
          ? notChosenEdges.map((edge) => `${edge.source} → ${edge.target}`).join(", ")
          : "Nenhuma"

      steps.push({
        description: "O grafo não é conectado. Não é possível completar a AGM.",
        visitedNodes: Array.from(visited),
        highlightedEdges: mstEdges,
        stats: {
          Algoritmo: "Prim - Árvore Geradora Mínima",
          Status: "Incompleto - Grafo não conectado",
          "Arestas na AGM": mstEdges.length,
          "Peso Total": totalWeight,
          "Nós Visitados": visited.size,
          "Nós Não Visitados": nodes.length - visited.size,
          "Ordem de Visita": visitOrder.join(" → "),
          "Nós Escolhidos": chosenNodes.join(", "),
          "Nós Não Escolhidos": notChosenNodes.join(", "),
          "Arestas na AGM": chosenEdgesFormatted,
          "Arestas Não Escolhidas": notChosenEdgesFormatted,
        },
      })
      break
    }

    // Add the edge to the MST
    mstEdges.push({ source: minEdge.source, target: minEdge.target })

    // Ensure we add the unvisited node
    const nodeToAdd = visited.has(minEdge.source) ? minEdge.target : minEdge.source
    visited.add(nodeToAdd)
    visitOrder.push(nodeToAdd) // Adicionar à ordem de visita

    totalWeight += minEdge.weight

    steps.push({
      description: `Adicionar aresta (${minEdge.source}, ${minEdge.target}) com peso ${minEdge.weight} à AGM.`,
      highlightedNodes: [minEdge.source, minEdge.target],
      visitedNodes: Array.from(visited),
      highlightedEdges: [...mstEdges],
      stats: {
        Algoritmo: "Prim - Árvore Geradora Mínima",
        "Aresta Adicionada": `(${minEdge.source}, ${minEdge.target})`,
        "Peso da Aresta": minEdge.weight,
        "Arestas na AGM": mstEdges.length,
        "Peso Total": totalWeight,
        "Nós Visitados": visited.size,
        "Nós Restantes": nodes.length - visited.size,
        "Ordem de Visita": visitOrder.join(" → "),
      },
    })
  }

  // Final step
  if (visited.size === nodes.length) {
    // Identificar nós e arestas escolhidos e não escolhidos
    const chosenNodes = Array.from(visited)
    const notChosenNodes = nodes.filter((node) => !visited.has(node))

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

    steps.push({
      description: "Algoritmo concluído. Árvore Geradora Mínima encontrada.",
      visitedNodes: Array.from(visited),
      highlightedEdges: mstEdges,
      stats: {
        Algoritmo: "Prim - Árvore Geradora Mínima",
        Status: "Completo",
        "Arestas na AGM": mstEdges.length,
        "Peso Total": totalWeight,
        "Nós Cobertos": visited.size,
        "Ordem de Visita": visitOrder.join(" → "),
        "Nós Escolhidos": chosenNodes.join(", "),
        "Nós Não Escolhidos": notChosenNodes.join(", "),
        "Arestas na AGM": chosenEdgesFormatted,
        "Arestas Não Escolhidas": notChosenEdgesFormatted,
      },
    })
  }

  return steps
}
