import type React from "react"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

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
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
