"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { translateText } from "@/app/actions/translate"
import { Loader2, Check, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TranslationSuggestionsProps {
  sourceText: string
  onApplySuggestion: (suggestion: string) => void
  sourceLang?: string
  targetLang?: string
}

export default function TranslationSuggestions({
  sourceText,
  onApplySuggestion,
  sourceLang = "en",
  targetLang = "pt",
}: TranslationSuggestionsProps) {
  const [isTranslating, setIsTranslating] = useState(false)
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGetSuggestion = async () => {
    if (!sourceText.trim()) {
      setError("Please enter some text to translate")
      return
    }

    setIsTranslating(true)
    setError(null)

    try {
      const result = await translateText(
        sourceText,
        sourceLang,
        targetLang,
        undefined,
        undefined,
        undefined,
        "gemini",
      )

      if (result.success && result.translation) {
        setSuggestion(result.translation)
      } else {
        setError(result.message || "Translation failed")
      }
    } catch (err) {
      setError("An error occurred during translation")
    } finally {
      setIsTranslating(false)
    }
  }

  const handleApplySuggestion = () => {
    if (suggestion) {
      onApplySuggestion(suggestion)
      setSuggestion(null)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Sugestão de Tradução</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!suggestion && !isTranslating && (
          <Button onClick={handleGetSuggestion} disabled={!sourceText.trim()}>
            Obter sugestão de tradução
          </Button>
        )}

        {isTranslating && (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Traduzindo...</span>
          </div>
        )}

        {suggestion && (
          <div className="space-y-2">
            <div className="rounded-md border p-3 bg-muted/50">
              <p>{suggestion}</p>
            </div>
          </div>
        )}
      </CardContent>
      {suggestion && (
        <CardFooter className="flex justify-end gap-2 pt-0">
          <Button variant="outline" size="sm" onClick={() => setSuggestion(null)}>
            <X className="h-4 w-4 mr-1" />
            Rejeitar
          </Button>
          <Button size="sm" onClick={handleApplySuggestion}>
            <Check className="h-4 w-4 mr-1" />
            Aplicar
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
