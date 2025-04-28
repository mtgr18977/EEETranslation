"use client"

import { useState, useEffect } from "react"
import {
  type AlignableElement,
  identifyAlignableElements,
  renderAlignedText,
  findMatchingElements,
} from "@/utils/alignment"

interface AlignedTextProps {
  sourceText: string
  targetText: string
  className?: string
}

export default function AlignedText({ sourceText, targetText, className = "" }: AlignedTextProps) {
  const [sourceElements, setSourceElements] = useState<AlignableElement[]>([])
  const [targetElements, setTargetElements] = useState<AlignableElement[]>([])
  const [elementMatches, setElementMatches] = useState<Record<string, string>>({})
  const [highlightedElementId, setHighlightedElementId] = useState<string>("")

  // Identify alignable elements when text changes
  useEffect(() => {
    const identifiedSourceElements = identifyAlignableElements(sourceText)
    const identifiedTargetElements = identifyAlignableElements(targetText)

    setSourceElements(identifiedSourceElements)
    setTargetElements(identifiedTargetElements)

    // Find matching elements
    const matches = findMatchingElements(identifiedSourceElements, identifiedTargetElements)
    setElementMatches(matches)
  }, [sourceText, targetText])

  const handleElementHover = (elementId: string) => {
    setHighlightedElementId(elementId)

    // Also highlight any matching elements
    if (elementId && elementMatches[elementId]) {
      setHighlightedElementId(elementMatches[elementId])
    }
  }

  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      <div className="p-3 bg-red-100 rounded-md">
        {renderAlignedText(sourceText, sourceElements, handleElementHover, highlightedElementId)}
      </div>
      <div className="p-3 bg-sky-100 rounded-md">
        {renderAlignedText(targetText, targetElements, handleElementHover, highlightedElementId)}
      </div>
    </div>
  )
}
