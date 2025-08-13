"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Zap, AlignLeft, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AlignedSegment {
  id: string
  portuguese: string
  english: string
  confidence: number
  status: "aligned" | "manual" | "rejected"
  alignmentType: "1:1" | "1:N" | "N:1" | "N:M"
  semanticScore: number
  keywordMatches: string[]
}

export function TextProcessor() {
  const [portugueseText, setPortugueseText] = useState("")
  const [englishText, setEnglishText] = useState("")
  const [alignedSegments, setAlignedSegments] = useState<AlignedSegment[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [debugInfo, setDebugInfo] = useState<{
    ptSentences: string[]
    enSentences: string[]
    alignmentScores: Array<{ ptIndex: number; enIndex: number; score: number; keywords: string[] }>
  } | null>(null)
  const { toast } = useToast()

  const splitIntoSentences = (text: string): string[] => {
    const normalized = text.replace(/\s+/g, " ").trim()

    const sentences = normalized
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5)

    return sentences
  }

  const findKeywordMatches = (pt: string, en: string): string[] => {
    const keywordPairs: Record<string, string[]> = {
      "2023": ["2023"],
      foco: ["focus", "focused"],
      produtos: ["products", "product"],
      redação: ["writing", "write"],
      técnica: ["technical"],
      responsável: ["responsible"],
      processos: ["processes", "process"],
      documentação: ["documentation", "document"],
      contato: ["contact"],
      time: ["team"],
      requisitos: ["requirements", "requirement"],
      reuniões: ["meetings", "meeting"],
      clientes: ["clients", "customers", "client"],
      nacionais: ["national"],
      internacionais: ["international"],
      gerenciando: ["managing", "manage"],
      auxiliando: ["helping", "assisting", "assist"],
      conduzindo: ["conducting", "leading", "lead"],
      refinamentos: ["refinements", "refinement"],
      desde: ["since"],
      atuo: ["working", "work"],
      mais: ["more"],
      sendo: ["being"],
      tenho: ["have"],
      estreito: ["close"],
      com: ["with"],
      nos: ["in", "on"],
      itens: ["items", "item"],
      nacionais: ["national"],
      internacionais: ["international"],
    }

    const ptLower = pt.toLowerCase()
    const enLower = en.toLowerCase()
    const matches: string[] = []

    Object.entries(keywordPairs).forEach(([ptWord, enWords]) => {
      if (ptLower.includes(ptWord) && enWords.some((enWord) => enLower.includes(enWord))) {
        matches.push(ptWord)
      }
    })

    return matches
  }

  const calculateSimpleSimilarity = (pt: string, en: string): number => {
    let score = 0

    const keywordMatches = findKeywordMatches(pt, en)
    score += keywordMatches.length * 0.15

    const ptNumbers = pt.match(/\d+/g) || []
    const enNumbers = en.match(/\d+/g) || []
    const numberMatches = ptNumbers.filter((num) => enNumbers.includes(num))
    score += numberMatches.length * 0.4

    const ptWords = pt.split(/\s+/).length
    const enWords = en.split(/\s+/).length

    if (ptWords > enWords * 1.2) {
      score += 0.3
    }

    const lengthRatio = Math.min(ptWords, enWords) / Math.max(ptWords, enWords)
    score += lengthRatio * 0.1

    return Math.min(score, 1)
  }

  const performSimpleAlignment = (
    ptSentences: string[],
    enSentences: string[],
  ): {
    alignments: AlignedSegment[]
    debugScores: Array<{ ptIndex: number; enIndex: number; score: number; keywords: string[] }>
  } => {
    const alignments: AlignedSegment[] = []
    const usedEn: boolean[] = new Array(enSentences.length).fill(false)
    const debugScores: Array<{ ptIndex: number; enIndex: number; score: number; keywords: string[] }> = []

    ptSentences.forEach((ptSentence, ptIndex) => {
      let bestMatch = -1
      let bestScore = 0
      let bestKeywords: string[] = []

      enSentences.forEach((enSentence, enIndex) => {
        const keywords = findKeywordMatches(ptSentence, enSentence)
        const score = calculateSimpleSimilarity(ptSentence, enSentence)

        debugScores.push({
          ptIndex,
          enIndex,
          score,
          keywords,
        })

        if (!usedEn[enIndex] && score > bestScore) {
          bestScore = score
          bestMatch = enIndex
          bestKeywords = keywords
        }
      })

      if (bestMatch !== -1 && bestScore > 0.05) {
        usedEn[bestMatch] = true

        alignments.push({
          id: `segment-${alignments.length}`,
          portuguese: ptSentence,
          english: enSentences[bestMatch],
          confidence: bestScore,
          status: bestScore > 0.3 ? "aligned" : "manual",
          alignmentType: "1:1",
          semanticScore: bestScore,
          keywordMatches: bestKeywords,
        })
      }
    })

    return {
      alignments: alignments.sort((a, b) => b.confidence - a.confidence),
      debugScores,
    }
  }

  const alignTexts = async () => {
    if (!portugueseText.trim() || !englishText.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira textos em ambos os idiomas.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProcessingProgress(0)

    try {
      setProcessingProgress(20)
      const ptSentences = splitIntoSentences(portugueseText)
      const enSentences = splitIntoSentences(englishText)

      setProcessingProgress(40)

      if (ptSentences.length === 0 || enSentences.length === 0) {
        throw new Error("Não foi possível dividir os textos em sentenças válidas")
      }

      setProcessingProgress(60)
      const { alignments, debugScores } = performSimpleAlignment(ptSentences, enSentences)

      setDebugInfo({
        ptSentences,
        enSentences,
        alignmentScores: debugScores,
      })

      setProcessingProgress(80)
      await new Promise((resolve) => setTimeout(resolve, 500))

      setAlignedSegments(alignments)
      setProcessingProgress(100)

      const highConfidence = alignments.filter((s) => s.confidence > 0.3).length

      toast({
        title: "Processamento Concluído",
        description: `${alignments.length} segmentos alinhados (${highConfidence} com alta confiança).`,
      })
    } catch (error) {
      toast({
        title: "Erro no Processamento",
        description: error instanceof Error ? error.message : "Ocorreu um erro durante o alinhamento dos textos.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const updateSegmentStatus = (id: string, status: AlignedSegment["status"]) => {
    setAlignedSegments((prev) => prev.map((segment) => (segment.id === id ? { ...segment, status } : segment)))
  }

  const saveAlignedSegments = () => {
    const approvedSegments = alignedSegments.filter((s) => s.status === "aligned")

    if (approvedSegments.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum segmento aprovado para salvar.",
        variant: "destructive",
      })
      return
    }

    const translationPairs = approvedSegments.map((segment) => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      portuguese: segment.portuguese,
      english: segment.english,
      category: "Processamento Automático",
    }))

    const existingMemory = JSON.parse(localStorage.getItem("translationMemory") || "[]")
    const updatedMemory = [...existingMemory, ...translationPairs]
    localStorage.setItem("translationMemory", JSON.stringify(updatedMemory))

    toast({
      title: "Sucesso",
      description: `${approvedSegments.length} segmentos salvos na memória de tradução!`,
    })

    setAlignedSegments([])
    setPortugueseText("")
    setEnglishText("")
  }

  const getStatusColor = (status: AlignedSegment["status"]) => {
    switch (status) {
      case "aligned":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "manual":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getStatusIcon = (status: AlignedSegment["status"]) => {
    switch (status) {
      case "aligned":
        return <CheckCircle className="h-4 w-4" />
      case "rejected":
        return <XCircle className="h-4 w-4" />
      default:
        return <RefreshCw className="h-4 w-4" />
    }
  }

  const getAlignmentTypeColor = (type: AlignedSegment["alignmentType"]) => {
    switch (type) {
      case "1:1":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "1:N":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "N:1":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "N:M":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Processamento Automático de Textos
          </CardTitle>
          <CardDescription>
            Insira textos longos em português e inglês para alinhamento automático inteligente de sentenças
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pt-text">Texto Completo em Português</Label>
              <Textarea
                id="pt-text"
                placeholder="Cole aqui o texto completo em português..."
                value={portugueseText}
                onChange={(e) => setPortugueseText(e.target.value)}
                className="min-h-[200px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="en-text">Texto Completo em Inglês</Label>
              <Textarea
                id="en-text"
                placeholder="Cole aqui o texto completo em inglês..."
                value={englishText}
                onChange={(e) => setEnglishText(e.target.value)}
                className="min-h-[200px]"
              />
            </div>
          </div>

          <Button onClick={alignTexts} className="w-full" disabled={isProcessing} size="lg">
            <AlignLeft className="h-4 w-4 mr-2" />
            {isProcessing ? "Processando..." : "Alinhar Textos Automaticamente"}
          </Button>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso do processamento</span>
                <span>{Math.round(processingProgress)}%</span>
              </div>
              <Progress value={processingProgress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Information */}
      {debugInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Informações de Debug</CardTitle>
            <CardDescription>Detalhes do processamento para diagnóstico</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Sentenças em Português ({debugInfo.ptSentences.length})</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {debugInfo.ptSentences.map((sentence, i) => (
                      <div key={i} className="text-xs p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <span className="font-mono text-blue-600">#{i}</span> {sentence.substring(0, 100)}...
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Sentenças em Inglês ({debugInfo.enSentences.length})</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {debugInfo.enSentences.map((sentence, i) => (
                      <div key={i} className="text-xs p-2 bg-green-50 dark:bg-green-900/20 rounded">
                        <span className="font-mono text-green-600">#{i}</span> {sentence.substring(0, 100)}...
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Top 10 Scores de Alinhamento</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {debugInfo.alignmentScores
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 10)
                    .map((score, i) => (
                      <div key={i} className="text-xs p-2 bg-gray-50 dark:bg-gray-900/20 rounded flex justify-between">
                        <span>
                          PT#{score.ptIndex} ↔ EN#{score.enIndex}
                        </span>
                        <span className="font-mono">{(score.score * 100).toFixed(1)}%</span>
                        <span className="text-blue-600">{score.keywords.join(", ")}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aligned Segments */}
      {alignedSegments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Segmentos Alinhados ({alignedSegments.length})</CardTitle>
            <CardDescription>Revise e aprove os alinhamentos antes de salvar na memória de tradução</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-xl font-bold text-green-600">
                    {alignedSegments.filter((s) => s.status === "aligned").length}
                  </div>
                  <div className="text-xs text-muted-foreground">Aprovados</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="text-xl font-bold text-yellow-600">
                    {alignedSegments.filter((s) => s.status === "manual").length}
                  </div>
                  <div className="text-xs text-muted-foreground">Revisão Manual</div>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-xl font-bold text-red-600">
                    {alignedSegments.filter((s) => s.status === "rejected").length}
                  </div>
                  <div className="text-xs text-muted-foreground">Rejeitados</div>
                </div>
              </div>

              {/* Segments List */}
              <div className="space-y-4">
                {alignedSegments.map((segment, index) => (
                  <div key={segment.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Segmento #{index + 1}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getStatusColor(segment.status)}>
                          {getStatusIcon(segment.status)}
                          <span className="ml-1 capitalize">{segment.status}</span>
                        </Badge>
                        <Badge variant="outline" className={getAlignmentTypeColor(segment.alignmentType)}>
                          {segment.alignmentType}
                        </Badge>
                        <Badge variant="secondary">{Math.round(segment.confidence * 100)}% confiança</Badge>
                      </div>
                    </div>

                    {segment.keywordMatches.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-muted-foreground">Palavras-chave:</span>
                        {segment.keywordMatches.slice(0, 5).map((keyword, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">PORTUGUÊS</Label>
                        <p className="text-sm mt-1">{segment.portuguese}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">INGLÊS</Label>
                        <p className="text-sm mt-1">{segment.english}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={segment.status === "aligned" ? "default" : "outline"}
                        onClick={() => updateSegmentStatus(segment.id, "aligned")}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant={segment.status === "manual" ? "default" : "outline"}
                        onClick={() => updateSegmentStatus(segment.id, "manual")}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Revisar
                      </Button>
                      <Button
                        size="sm"
                        variant={segment.status === "rejected" ? "destructive" : "outline"}
                        onClick={() => updateSegmentStatus(segment.id, "rejected")}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <Button
                onClick={saveAlignedSegments}
                className="w-full"
                size="lg"
                disabled={alignedSegments.filter((s) => s.status === "aligned").length === 0}
              >
                Salvar {alignedSegments.filter((s) => s.status === "aligned").length} Segmentos Aprovados
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
