"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { InfoIcon, TrendingUp, TrendingDown, Minus, BookOpen, Target, Lightbulb } from "lucide-react"
import { calculateReadability, getReadabilityLevelDescription, type ReadabilityResult } from "@/utils/readability"

interface ReadabilityPanelProps {
  sourceText: string
  targetText: string
  sourceLang: string
  targetLang: string
  className?: string
}

export default function ReadabilityPanel({
  sourceText,
  targetText,
  sourceLang,
  targetLang,
  className = "",
}: ReadabilityPanelProps) {
  const [showDetails, setShowDetails] = useState(false)

  const sourceReadability = useMemo(() => {
    if (!sourceText.trim()) return null
    return calculateReadability(sourceText, sourceLang)
  }, [sourceText, sourceLang])

  const targetReadability = useMemo(() => {
    if (!targetText.trim()) return null
    return calculateReadability(targetText, targetLang)
  }, [targetText, targetLang])

  const getReadabilityTips = (readability: ReadabilityResult): string[] => {
    const tips: string[] = []

    if (readability.averageGrade > 12) {
      tips.push("Considere usar frases mais curtas para melhorar a leiturabilidade")
      tips.push("Substitua palavras complexas por sinônimos mais simples quando possível")
    }

    if (readability.flesch.score < 50) {
      tips.push("O texto está difícil de ler. Tente dividir frases longas")
    }

    if (readability.gunningFog.score > 14) {
      tips.push("Reduza o uso de palavras com muitas sílabas")
    }

    if (tips.length === 0) {
      tips.push("A leiturabilidade está em um bom nível!")
    }

    return tips
  }

  const getReadabilityComparison = () => {
    if (!sourceReadability || !targetReadability) return null

    const sourceFlesch = sourceReadability.flesch.score
    const targetFlesch = targetReadability.flesch.score
    const difference = targetFlesch - sourceFlesch

    if (Math.abs(difference) < 5) {
      return { trend: "stable", message: "Leiturabilidade mantida", icon: <Minus className="h-4 w-4" /> }
    } else if (difference > 0) {
      return {
        trend: "improved",
        message: "Leiturabilidade melhorada",
        icon: <TrendingUp className="h-4 w-4 text-green-600" />,
      }
    } else {
      return {
        trend: "decreased",
        message: "Leiturabilidade reduzida",
        icon: <TrendingDown className="h-4 w-4 text-red-600" />,
      }
    }
  }

  const comparison = getReadabilityComparison()

  if (!sourceReadability && !targetReadability) {
    return (
      <Card className={`${className} border-gray-200`}>
        <CardContent className="p-4">
          <div className="flex items-center text-gray-500">
            <BookOpen className="h-5 w-5 mr-2" />
            <span>Adicione texto para ver a análise de leiturabilidade</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            <span>Leiturabilidade</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 ml-2 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    Análise da facilidade de leitura do texto usando múltiplos índices. Scores mais altos no Flesch
                    indicam texto mais fácil.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {comparison && (
            <div className="flex items-center text-sm">
              {comparison.icon}
              <span className="ml-1">{comparison.message}</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Source Text Readability */}
          {sourceReadability && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Texto Original</span>
                <Badge variant="outline" className="text-xs">
                  {getReadabilityLevelDescription(sourceReadability.flesch.level)}
                </Badge>
              </div>
              <ReadabilityScoreBar
                score={sourceReadability.flesch.score}
                level={sourceReadability.flesch.level}
                isFleschScore={true}
              />
              <div className="text-xs text-muted-foreground">
                Flesch: {Math.round(sourceReadability.flesch.score)} | Nível médio:{" "}
                {sourceReadability.averageGrade.toFixed(1)}
              </div>
            </div>
          )}

          {/* Target Text Readability */}
          {targetReadability && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tradução</span>
                <Badge variant="outline" className="text-xs">
                  {getReadabilityLevelDescription(targetReadability.flesch.level)}
                </Badge>
              </div>
              <ReadabilityScoreBar
                score={targetReadability.flesch.score}
                level={targetReadability.flesch.level}
                isFleschScore={true}
              />
              <div className="text-xs text-muted-foreground">
                Flesch: {Math.round(targetReadability.flesch.score)} | Nível médio:{" "}
                {targetReadability.averageGrade.toFixed(1)}
              </div>
            </div>
          )}

          {/* Readability Tips */}
          {targetReadability && (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full justify-start p-2 h-auto text-blue-600"
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                <span className="text-sm">{showDetails ? "Ocultar dicas" : "Ver dicas de melhoria"}</span>
              </Button>

              {showDetails && (
                <div className="space-y-2 ml-4">
                  {getReadabilityTips(targetReadability).map((tip, index) => (
                    <div key={index} className="flex items-start text-xs text-gray-600">
                      <Target className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Detailed Scores */}
          {showDetails && targetReadability && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="text-sm font-medium">Índices Detalhados</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>Flesch-Kincaid:</span>
                  <span>{targetReadability.fleschKincaid.score.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Coleman-Liau:</span>
                  <span>{targetReadability.colemanLiau.score.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gunning Fog:</span>
                  <span>{targetReadability.gunningFog.score.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SMOG:</span>
                  <span>{targetReadability.smog.score.toFixed(1)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface ReadabilityScoreBarProps {
  score: number
  level: "very-easy" | "easy" | "medium" | "difficult" | "very-difficult"
  isFleschScore?: boolean
}

function ReadabilityScoreBar({ score, level, isFleschScore = false }: ReadabilityScoreBarProps) {
  const progressValue = isFleschScore ? score : Math.max(0, Math.min(100, (18 - score) * 5.56))

  const getProgressColor = () => {
    switch (level) {
      case "very-easy":
        return "bg-green-500"
      case "easy":
        return "bg-green-400"
      case "medium":
        return "bg-yellow-400"
      case "difficult":
        return "bg-orange-400"
      case "very-difficult":
        return "bg-red-500"
      default:
        return "bg-gray-400"
    }
  }

  return (
    <div className="space-y-1">
      <Progress
        value={progressValue}
        className="h-2"
        style={{
          background: "#e5e7eb",
        }}
      />
      <style jsx>{`
        .progress-indicator {
          background: ${getProgressColor()};
        }
      `}</style>
    </div>
  )
}
