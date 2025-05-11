import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Visualizador Interativo de Algoritmos de Grafos",
  description: "Visualizador Interativo de Algoritmos de Grafos desenvolvido por Edilberto Cantuaria e Kauan Eiras",
  generator: "Edilberto Cantuaria e Kauan Eiras",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
