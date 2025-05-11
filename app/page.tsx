import GraphVisualizer from "@/components/graph-visualizer"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Graph Algorithm Visualizer</h1>
      <GraphVisualizer />
    </main>
  )
}
