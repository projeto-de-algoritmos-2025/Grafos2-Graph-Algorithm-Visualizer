import GraphVisualizer from "@/components/graph-visualizer"
import Image from "next/image"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <div className="flex flex-row items-center justify-center mb-8 gap-6">
        <Image src="/interGraph.png" alt="InterGraph Logo" width={80} height={80} className="h-20 w-20" />
        <h1 className="text-4xl font-bold text-center">InterGraph</h1>
      </div>
      <GraphVisualizer />
    </main>
  )
}
