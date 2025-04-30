import type React from "react"
import "./globals.css"

// Modificar o título da página para "EeeTranslation"
export const metadata = {
  title: "EeeTranslation",
  description: "Translation platform for tech writing",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
