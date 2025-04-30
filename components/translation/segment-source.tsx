"use client"

import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import type { SegmentPair } from "@/utils/segmentation"
import type { GlossaryTerm } from "@/utils/glossary"
import ExternalLink from "../external-link"

interface SegmentSourceProps {
  segment: SegmentPair
  highlightedTerms: { term: GlossaryTerm; index: number }[]
}

export default function SegmentSource({ segment, highlightedTerms }: SegmentSourceProps) {
  if (!segment.source || highlightedTerms.length === 0) {
    return (
      <div className="p-3 bg-rose-50 rounded-md min-h-[60px] whitespace-pre-wrap border border-rose-100">
        {segment.source}
      </div>
    )
  }

  const result = []
  let lastIndex = 0

  // Ordenar termos por índice para garantir a ordem correta
  const sortedTerms = [...highlightedTerms].sort((a, b) => a.index - b.index)

  for (const { term, index } of sortedTerms) {
    // Adicionar texto antes do termo
    if (index > lastIndex) {
      result.push(segment.source.substring(lastIndex, index))
    }

    // Adicionar o termo destacado
    const termText = segment.source.substring(index, index + term.term.length)
    result.push(
      <TooltipProvider key={`term-${index}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="bg-yellow-200 px-0.5 rounded cursor-help">{termText}</span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">{term.term}</p>
              <p className="text-xs">{term.definition}</p>
              {term.relatedUrl && (
                <a
                  href={term.relatedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center"
                >
                  {term.relatedName || term.relatedUrl}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    )

    lastIndex = index + term.term.length
  }

  // Adicionar texto restante
  if (lastIndex < segment.source.length) {
    result.push(segment.source.substring(lastIndex))
  }

  return (
    <div className="p-3 bg-rose-50 rounded-md min-h-[60px] whitespace-pre-wrap border border-rose-100">{result}</div>
  )
}
