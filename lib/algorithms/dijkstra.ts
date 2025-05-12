import type { GraphData, AlgorithmStep } from "../types";

// Dijkstra's algorithm for shortest paths
export function runDijkstra(
  graphData: GraphData,
  sourceNode: number,
  targetNode: number | null = null
): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  const nodes = graphData.nodes.map((n) => n.id);
  const distances: Record<number, number> = {};
  const previous: Record<number, number | null> = {};
  const unvisited = new Set(nodes);
  const visitOrder: number[] = []; // Para rastrear a ordem de visita dos nós

  // Initialize distances
  for (const node of nodes) {
    distances[node] = node === sourceNode ? 0 : Number.POSITIVE_INFINITY;
    previous[node] = null;
  }

  steps.push({
    description: `Inicializar distâncias: definir distância do nó de origem ${sourceNode} como 0, todos os outros como infinito.`,
    highlightedNodes: [sourceNode],
    nodeValues: { ...distances },
    stats: {
      Algoritmo: "Dijkstra - Caminho Mínimo",
      "Nó de Origem": sourceNode,
      "Nó de Destino": targetNode !== null ? targetNode : "Nenhum",
      "Ordem de Visita": "",
    },
  });

  // Flag para indicar se encontramos o destino
  let foundTarget = false;

  // Modificar o loop principal para parar quando encontrar o destino
  while (unvisited.size > 0 && !foundTarget) {
    // Find the unvisited node with the smallest distance
    let current: number | null = null;
    let smallestDistance = Number.POSITIVE_INFINITY;

    for (const node of unvisited) {
      if (distances[node] < smallestDistance) {
        smallestDistance = distances[node];
        current = node;
      }
    }

    // If we can't find a node or the smallest distance is infinity, we're done
    if (current === null || distances[current] === Number.POSITIVE_INFINITY) {
      break;
    }

    // Mark the current node as visited
    unvisited.delete(current);
    visitOrder.push(current); // Adicionar à ordem de visita
    const visitedNodes = nodes.filter((n) => !unvisited.has(n));

    // Check if we've reached the target node
    if (targetNode !== null && current === targetNode) {
      foundTarget = true;
      steps.push({
        description: `Nó de destino ${targetNode} alcançado com distância ${distances[current]}.`,
        highlightedNodes: [current],
        visitedNodes,
        nodeValues: { ...distances },
        stats: {
          "Nó Atual": current,
          "Nó de Destino": targetNode,
          "Distância Final": distances[current],
          "Nós Visitados": visitedNodes.length,
          "Ordem de Visita": visitOrder.join(" → "),
        },
      });
      break; // Parar o algoritmo imediatamente
    }

    steps.push({
      description: `Visitar nó ${current} com distância atual ${distances[current]}.`,
      highlightedNodes: [current],
      visitedNodes,
      nodeValues: { ...distances },
      stats: {
        "Nó Atual": current,
        Distância:
          distances[current] === Number.POSITIVE_INFINITY
            ? "∞"
            : distances[current],
        "Nós Visitados": visitedNodes.length,
        "Nós Restantes": unvisited.size,
        "Ordem de Visita": visitOrder.join(" → "),
      },
    });

    // Get all edges from the current node considering direction
    const edges = graphData.edges.filter(
      (e) =>
        (e.source === current && e.directed) ||
        ((e.source === current || e.target === current) && !e.directed)
    );
    // Update distances to neighbors
    for (const edge of edges) {
      const neighbor = edge.source === current ? edge.target : edge.source;

      if (unvisited.has(neighbor)) {
        const weight = edge.weight;
        const distanceToNeighbor = distances[current] + weight;

        if (distanceToNeighbor < distances[neighbor]) {
          distances[neighbor] = distanceToNeighbor;
          previous[neighbor] = current;

          steps.push({
            description: `Atualizar distância para o nó ${neighbor} para ${distanceToNeighbor} via nó ${current}.`,
            highlightedNodes: [current, neighbor],
            visitedNodes,
            highlightedEdges: [{ source: current, target: neighbor }],
            nodeValues: { ...distances },
            stats: {
              "Nó Atual": current,
              Vizinho: neighbor,
              "Nova Distância": distanceToNeighbor,
              "Nós Visitados": visitedNodes.length,
              "Nós Restantes": unvisited.size,
              "Ordem de Visita": visitOrder.join(" → "),
            },
          });
        } else {
          steps.push({
            description: `Não é necessário atualizar o nó ${neighbor}, pois o caminho atual (${distances[neighbor]}) é mais curto que o novo caminho (${distanceToNeighbor}).`,
            highlightedNodes: [current, neighbor],
            visitedNodes,
            highlightedEdges: [{ source: current, target: neighbor }],
            nodeValues: { ...distances },
            stats: {
              "Nó Atual": current,
              Vizinho: neighbor,
              "Distância Atual":
                distances[neighbor] === Number.POSITIVE_INFINITY
                  ? "∞"
                  : distances[neighbor],
              "Distância Novo Caminho": distanceToNeighbor,
              "Nós Visitados": visitedNodes.length,
              "Nós Restantes": unvisited.size,
              "Ordem de Visita": visitOrder.join(" → "),
            },
          });
        }
      }
    }

    // Se encontramos o destino durante a atualização dos vizinhos, paramos o loop principal
    if (foundTarget) {
      break;
    }
  }

  // Reconstruir o caminho mínimo
  const finalEdges: { source: number; target: number }[] = [];
  let pathNodes: number[] = [];

  if (targetNode !== null) {
    // Se um nó de destino foi especificado, mostrar apenas o caminho para esse nó
    let current: number | null = targetNode;
    const path: number[] = [];

    while (current !== null) {
      path.unshift(current);
      current = previous[current];
    }

    // Incluir o caminho apenas se começar do nó de origem
    if (path.length > 0 && path[0] === sourceNode) {
      pathNodes = [...path];

      // Criar arestas apenas para o caminho específico
      for (let i = 0; i < path.length - 1; i++) {
        finalEdges.push({
          source: path[i],
          target: path[i + 1],
        });
      }
    }
  } else {
    // Caso contrário, mostrar caminhos para todos os nós alcançáveis
    for (const node of nodes) {
      if (node !== sourceNode && previous[node] !== null) {
        finalEdges.push({
          source: previous[node]!,
          target: node,
        });
      }
    }

    // Incluir todos os nós que são alcançáveis a partir da origem
    pathNodes = nodes.filter(
      (node) =>
        node === sourceNode ||
        (distances[node] !== Number.POSITIVE_INFINITY &&
          previous[node] !== null)
    );
  }

  // Calcular a distância total para o caminho
  let totalDistance = 0;
  if (
    targetNode !== null &&
    distances[targetNode] !== Number.POSITIVE_INFINITY
  ) {
    totalDistance = distances[targetNode];
  } else if (targetNode === null) {
    // Soma de todos os caminhos mais curtos
    totalDistance =
      Object.values(distances)
        .filter((d) => d !== Number.POSITIVE_INFINITY)
        .reduce((sum, d) => sum + d, 0) - distances[sourceNode];
  }

  // Verificar se o caminho para o destino foi encontrado
  const pathFound =
    targetNode === null ||
    (targetNode !== null && distances[targetNode] !== Number.POSITIVE_INFINITY);

  // Criar listas de nós e arestas escolhidos e não escolhidos para o resultado
  const chosenNodes = pathNodes;
  const notChosenNodes = nodes.filter((node) => !chosenNodes.includes(node));

  // Identificar arestas no caminho e fora do caminho
  const chosenEdges = finalEdges;
  const notChosenEdges = graphData.edges.filter(
    (edge) =>
      !chosenEdges.some(
        (chosen) =>
          (chosen.source === edge.source && chosen.target === edge.target) ||
          (!edge.directed &&
            chosen.source === edge.target &&
            chosen.target === edge.source)
      )
  );

  // Formatar as arestas escolhidas para exibição
  const chosenEdgesFormatted = chosenEdges
    .map((edge) => `${edge.source} → ${edge.target}`)
    .join(", ");

  // Formatar as arestas não escolhidas para exibição
  const notChosenEdgesFormatted =
    notChosenEdges.length > 0
      ? notChosenEdges
          .map((edge) => `${edge.source} → ${edge.target}`)
          .join(", ")
      : "Nenhuma";

  steps.push({
    description:
      targetNode !== null
        ? pathFound
          ? `Algoritmo concluído. Caminho mais curto de ${sourceNode} para ${targetNode} está destacado com distância ${distances[targetNode]}.`
          : `Algoritmo concluído. Não existe caminho de ${sourceNode} para ${targetNode}.`
        : "Algoritmo concluído. Os caminhos mais curtos a partir do nó de origem estão destacados.",
    visitedNodes: nodes.filter(
      (n) => distances[n] !== Number.POSITIVE_INFINITY
    ),
    highlightedNodes: pathNodes,
    highlightedEdges: finalEdges,
    nodeValues: { ...distances },
    stats: {
      Algoritmo: "Dijkstra - Caminho Mínimo",
      "Nó de Origem": sourceNode,
      "Nó de Destino": targetNode !== null ? targetNode : "Todos",
      "Caminho Encontrado": pathFound ? "Sim" : "Não",
      "Arestas no Caminho": chosenEdgesFormatted,
      "Distância Total": pathFound ? totalDistance : "∞",
      "Ordem de Visita": visitOrder.join(" → "),
      "Nós no Caminho": chosenNodes.join(", "),
      "Nós Não Escolhidos":
        notChosenNodes.length > 0 ? notChosenNodes.join(", ") : "Nenhum",
      "Arestas Não Escolhidas": notChosenEdgesFormatted,
    },
  });

  return steps;
}
