import { DEBUG } from "./debug"

/**
 * Split text into segments (sentences or paragraphs)
 */
export function splitIntoSegments(text: string, segmentType: "sentence" | "paragraph" = "sentence"): string[] {
  if (!text || !text.trim()) return []

  DEBUG.log("Splitting text:", text.substring(0, 50) + "...")

  if (segmentType === "paragraph") {
    // Split by paragraphs (double line breaks)
    const paragraphs = text.split(/\n\s*\n/)
    const result = paragraphs.map((p) => p.trim()).filter((p) => p !== "")
    DEBUG.log("Split into paragraphs:", result.length)
    return result
  } else {
    // Approach for sentence segmentation
    // First, preserve line breaks by replacing them with a special marker
    const LINE_BREAK_MARKER = "___LINE_BREAK___"
    const textWithMarkers = text.replace(/\n/g, LINE_BREAK_MARKER)

    // Split by sentences
    const sentenceRegex = /[^.!?]+[.!?]+|[^.!?]+$/g
    const matches = textWithMarkers.match(sentenceRegex) || []

    // Process each sentence and restore line breaks
    const segments: string[] = []

    for (const match of matches) {
      if (match.includes(LINE_BREAK_MARKER)) {
        // If the sentence contains line breaks, split it further
        const parts = match.split(LINE_BREAK_MARKER)

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i].trim()
          if (part) segments.push(part)

          // Add a line break segment after each part except the last
          if (i < parts.length - 1) {
            segments.push("\n")
          }
        }
      } else {
        // Regular sentence without line breaks
        segments.push(match.trim())
      }
    }

    DEBUG.log("Split into sentences:", segments.length)
    return segments.filter(Boolean)
  }
}

/**
 * Join segments back into a single text
 */
export function joinSegments(segments: string[]): string {
  if (!segments || segments.length === 0) return ""

  DEBUG.log("Joining segments:", segments.length)

  // Join segments with proper spacing
  let result = ""

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]

    // Handle line breaks
    if (segment === "\n") {
      result += "\n"
      continue
    }

    // Add space between segments if needed
    if (i > 0 && segments[i - 1] !== "\n" && !result.endsWith("\n")) {
      result += " "
    }

    result += segment
  }

  DEBUG.log("Joined text:", result.substring(0, 50) + "...")
  return result
}

/**
 * Create a mapping between source and target segments
 */
export interface SegmentPair {
  id: string
  source: string
  target: string
  isTranslated: boolean
  isLineBreak: boolean
  originalIndex: number // Track the original position
}

export function createSegmentPairs(sourceSegments: string[], targetSegments: string[] = []): SegmentPair[] {
  DEBUG.log("Creating segment pairs:", sourceSegments.length, targetSegments.length)

  return sourceSegments.map((source, index) => {
    const isLineBreak = source === "\n"

    return {
      id: `segment-${index}`,
      source: isLineBreak ? "" : source,
      target: targetSegments[index] || "",
      isTranslated: Boolean(targetSegments[index]),
      isLineBreak,
      originalIndex: index,
    }
  })
}

/**
 * Função auxiliar para garantir que cada segmento mantenha sua própria tradução
 */
export function ensureSegmentIntegrity(segments: SegmentPair[]): SegmentPair[] {
  return segments.map((segment) => {
    // Se for uma quebra de linha, garantimos que o target também seja uma quebra de linha
    if (segment.isLineBreak) {
      return {
        ...segment,
        target: "\n",
        isTranslated: true,
      }
    }
    return segment
  })
}
