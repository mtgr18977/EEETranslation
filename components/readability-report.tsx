"use client"

import { useMemo } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { InfoIcon } from "lucide-react"
import { calculateReadability, getReadabilityLevelColor, getReadabilityLevelDescription } from "@/utils/readability"

interface ReadabilityReportProps {
  text: string
  lang: string
}

export default function ReadabilityReport({ text, lang }: ReadabilityReportProps) {
  const readability = useMemo(() => {
    if (!text.trim()) return null
    return calculateReadability(text, lang)
  }, [text, lang])

  if (!readability) {
    return null
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium flex items-center">
        Leiturabilidade
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="h-3 w-3 ml-1 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">
                Índices de leiturabilidade medem a facilidade de leitura do texto. Scores mais altos no Flesch indicam
                texto mais fácil. Scores mais baixos nos outros índices indicam texto mais fácil.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </h3>

      <div className="space-y-2">
        <ReadabilityScoreItem
          name="Flesch"
          score={readability.flesch.score}
          level={readability.flesch.level}
          description={`${readability.flesch.grade} (${Math.round(readability.flesch.score)})`}
          isInverted={true}
        />

        <ReadabilityScoreItem
          name="Flesch-Kincaid"
          score={readability.fleschKincaid.score}
          level={readability.fleschKincaid.level}
          description={`${readability.fleschKincaid.grade} (${readability.fleschKincaid.score.toFixed(1)})`}
        />

        <ReadabilityScoreItem
          name="Coleman-Liau"
          score={readability.colemanLiau.score}
          level={readability.colemanLiau.level}
          description={`${readability.colemanLiau.grade} (${readability.colemanLiau.score.toFixed(1)})`}
        />

        <ReadabilityScoreItem
          name="Gunning Fog"
          score={readability.gunningFog.score}
          level={readability.gunningFog.level}
          description={`${readability.gunningFog.grade} (${readability.gunningFog.score.toFixed(1)})`}
        />

        <ReadabilityScoreItem
          name="SMOG"
          score={readability.smog.score}
          level={readability.smog.level}
          description={`${readability.smog.grade} (${readability.smog.score.toFixed(1)})`}
        />
      </div>

      <div className="pt-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Nível médio: {Math.round(readability.averageGrade * 10) / 10}</span>
          <span>{getReadabilityLevelDescription(readability.fleschKincaid.level)}</span>
        </div>
      </div>
    </div>
  )
}

interface ReadabilityScoreItemProps {
  name: string
  score: number
  level: "very-easy" | "easy" | "medium" | "difficult" | "very-difficult"
  description: string
  isInverted?: boolean
}

function ReadabilityScoreItem({ name, score, level, description, isInverted = false }: ReadabilityScoreItemProps) {
  return (
    <div className="flex justify-between items-center text-xs py-1 border-b border-gray-100">
      <span>{name}</span>
      <div className="flex items-center gap-2">
        <span className={`px-1.5 py-0.5 rounded-full text-white text-xs ${getReadabilityLevelColor(level)}`}>
          {isInverted ? Math.round(score) : Math.round(score * 10) / 10}
        </span>
        <span>{description}</span>
      </div>
    </div>
  )
}
