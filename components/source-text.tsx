"use client"

import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SourceTextProps {
  text: string
  onChange: (text: string) => void
}

export default function SourceText({ text, onChange }: SourceTextProps) {
  return (
    <Card className="flex-1 bg-red-100 overflow-hidden">
      <CardHeader className="p-4 pb-0">
        <CardTitle>Texto original</CardTitle>
      </CardHeader>
      <CardContent className="p-4 h-full">
        <Textarea
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Texto original aparecerá aqui após o upload ou você pode digitar diretamente..."
          className="h-full min-h-[500px] resize-none border-none bg-transparent focus-visible:ring-0"
        />
      </CardContent>
    </Card>
  )
}
