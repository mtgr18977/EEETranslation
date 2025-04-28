"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface InfoPanelProps {
  sourceText: string
  targetText: string
  sourceLang?: string
  targetLang?: string
}

export default function InfoPanel({ sourceText, targetText, sourceLang = "en", targetLang = "pt" }: InfoPanelProps) {
  // Calculate statistics
  const sourceLines = sourceText ? sourceText.split("\n").length : 0
  const sourceChars = sourceText ? sourceText.length : 0
  const sourceWords = sourceText ? sourceText.split(/\s+/).filter(Boolean).length : 0

  const targetLines = targetText ? targetText.split("\n").length : 0
  const targetChars = targetText ? targetText.length : 0
  const targetWords = targetText ? targetText.split(/\s+/).filter(Boolean).length : 0

  const progress = sourceWords > 0 ? Math.round((targetWords / sourceWords) * 100) : 0

  // Language name mapping
  const languageNames: Record<string, string> = {
    en: "English",
    pt: "Portuguese",
    es: "Spanish",
    fr: "French",
    de: "German",
    it: "Italian",
    ja: "Japanese",
    zh: "Chinese",
    ru: "Russian",
    ar: "Arabic",
  }

  return (
    <Card className="w-64 bg-amber-100 overflow-auto">
      <CardHeader className="p-4 pb-0">
        <CardTitle>Info</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-medium">Texto original ({languageNames[sourceLang] || sourceLang})</h3>
            <div className="grid grid-cols-2 gap-1 text-sm">
              <div>Linhas:</div>
              <div className="text-right">{sourceLines}</div>
              <div>Palavras:</div>
              <div className="text-right">{sourceWords}</div>
              <div>Caracteres:</div>
              <div className="text-right">{sourceChars}</div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Texto traduzido ({languageNames[targetLang] || targetLang})</h3>
            <div className="grid grid-cols-2 gap-1 text-sm">
              <div>Linhas:</div>
              <div className="text-right">{targetLines}</div>
              <div>Palavras:</div>
              <div className="text-right">{targetWords}</div>
              <div>Caracteres:</div>
              <div className="text-right">{targetChars}</div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Progresso</h3>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="text-sm text-right">{progress}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
