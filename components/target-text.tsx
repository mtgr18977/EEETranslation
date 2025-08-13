"use client"

import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TargetTextProps {
  text: string
  onChange: (text: string) => void
}

export default function TargetText({ text, onChange }: TargetTextProps) {
  return (
    <Card className="flex-1 bg-blue-50 overflow-hidden shadow-sm border-blue-100">
      <CardHeader className="p-4 pb-0">
        <CardTitle>Texto traduzido</CardTitle>
      </CardHeader>
      <CardContent className="p-4 h-[calc(100%-60px)]">
        <Textarea
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Digite a tradução aqui..."
          className="h-full resize-none border-none bg-transparent focus-visible:ring-0"
        />
      </CardContent>
    </Card>
  )
}
