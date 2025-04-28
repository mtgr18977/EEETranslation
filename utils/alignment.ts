"use client"

import type React from "react"

/**
 * Types of elements that can be aligned between source and target text
 */
export type AlignableElementType = "number" | "tag" | "proper" | "url" | "email" | "date"

/**
 * Represents an alignable element in the text
 */
export interface AlignableElement {
  id: string
  type: AlignableElementType
  text: string
  startIndex: number
  endIndex: number
}

/**
 * Identifies alignable elements in a text
 */
export function identifyAlignableElements(text: string): AlignableElement[] {
  if (!text) return []

  const elements: AlignableElement[] = []

  // Find numbers
  const numberRegex = /\b\d+(?:[.,]\d+)*\b/g
  let match: RegExpExecArray | null

  while ((match = numberRegex.exec(text)) !== null) {
    elements.push({
      id: `num-${elements.length}`,
      type: "number",
      text: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    })
  }

  // Find URLs
  const urlRegex = /https?:\/\/[^\s]+/g
  while ((match = urlRegex.exec(text)) !== null) {
    elements.push({
      id: `url-${elements.length}`,
      type: "url",
      text: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    })
  }

  // Find email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
  while ((match = emailRegex.exec(text)) !== null) {
    elements.push({
      id: `email-${elements.length}`,
      type: "email",
      text: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    })
  }

  // Find dates (simple pattern)
  const dateRegex = /\b\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}\b/g
  while ((match = dateRegex.exec(text)) !== null) {
    elements.push({
      id: `date-${elements.length}`,
      type: "date",
      text: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    })
  }

  // Find proper nouns (simplified - words starting with capital letters)
  // This is a simplification and would need more sophisticated NLP in a real app
  const properRegex = /\b[A-Z][a-z]+\b/g
  while ((match = properRegex.exec(text)) !== null) {
    // Skip if it's at the beginning of a sentence
    const prevChar = text[match.index - 1]
    if (match.index === 0 || prevChar === "." || prevChar === "!" || prevChar === "?") {
      continue
    }

    elements.push({
      id: `proper-${elements.length}`,
      type: "proper",
      text: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    })
  }

  // Sort elements by their position in the text
  return elements.sort((a, b) => a.startIndex - b.startIndex)
}

/**
 * Renders text with highlighted alignable elements
 */
export function renderAlignedText(
  text: string,
  elements: AlignableElement[],
  onElementHover?: (id: string) => void,
  highlightedElementId?: string,
): React.ReactNode {
  if (!text || !elements.length) return text

  const result: React.ReactNode[] = []
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
        onMouseEnter={() => onElementHover && onElementHover(element.id)}
        onMouseLeave={() => onElementHover && onElementHover("")}
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

/**
 * Get the background color for an element type
 */
function getElementColor(type: AlignableElementType, isHighlighted: boolean): string {
  const baseColors: Record<AlignableElementType, string> = {
    number: "bg-blue-100",
    tag: "bg-purple-100",
    proper: "bg-yellow-100",
    url: "bg-green-100",
    email: "bg-teal-100",
    date: "bg-orange-100",
  }

  const highlightColors: Record<AlignableElementType, string> = {
    number: "bg-blue-300",
    tag: "bg-purple-300",
    proper: "bg-yellow-300",
    url: "bg-green-300",
    email: "bg-teal-300",
    date: "bg-orange-300",
  }

  return isHighlighted ? highlightColors[type] : baseColors[type]
}

/**
 * Find matching elements between source and target text
 */
export function findMatchingElements(
  sourceElements: AlignableElement[],
  targetElements: AlignableElement[],
): Record<string, string> {
  const matches: Record<string, string> = {}

  sourceElements.forEach((sourceElement) => {
    // Find a matching element in the target
    const matchingElement = targetElements.find(
      (targetElement) => targetElement.text === sourceElement.text && targetElement.type === sourceElement.type,
    )

    if (matchingElement) {
      matches[sourceElement.id] = matchingElement.id
      matches[matchingElement.id] = sourceElement.id
    }
  })

  return matches
}
