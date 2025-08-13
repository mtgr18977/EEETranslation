"use client"

import { useState, useEffect } from "react"
import {
  type AlignableElement,
  identifyAlignableElements,
  findMatchingElements,
  getElementColor,
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

  const renderAlignedText = (text: string, elements: AlignableElement[]) => {
    if (!text || !elements.length) return text

    const result = []
    let lastIndex = 0

    elements.forEach((element) => {
      // Add text before this element
      if (element.startIndex > lastIndex) {
        result.push(text.substring(lastIndex, element.startIndex))
      }

      // Add the element with highlighting
      const isHighlighted = element.id === highlightedElementId

      result.push(
        <span
          key={element.id}
          className={`cursor-pointer inline-block px-0.5 rounded ${getElementColor(element.type, isHighlighted)}`}
          onMouseEnter={() => handleElementHover(element.id)}
          onMouseLeave={() => handleElementHover("")}
          data-element-id={element.id}
          data-element-type={element.type}
        >
          {element.text}
        </span>,
      )

      lastIndex = element.endIndex
    })

    // Add any remaining text
    if (lastIndex < text.length) {
      result.push(text.substring(lastIndex))
    }

    return result
  }

  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      <div className="p-3 bg-rose-50 rounded-md border border-rose-100">
        {renderAlignedText(sourceText, sourceElements)}
      </div>
      <div className="p-3 bg-blue-50 rounded-md border border-blue-100">
        {renderAlignedText(targetText, targetElements)}
      </div>
    </div>
  )
}
