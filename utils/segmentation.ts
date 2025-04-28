/**
 * Split text into segments (sentences or paragraphs)
 */
export function splitIntoSegments(text: string, segmentType: "sentence" | "paragraph" = "sentence"): string[] {
  if (!text.trim()) return []

  if (segmentType === "paragraph") {
    // Split by paragraphs (double line breaks)
    return text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
  } else {
    // Split by sentences, preserving line breaks
    // This is a more robust sentence splitter that preserves line breaks
    const segments: string[] = []
    const lines = text.split(/\n/)

    lines.forEach((line) => {
      if (!line.trim()) {
        // Preserve empty lines as separate segments
        segments.push("")
        return
      }

      // Split the line into sentences
      const sentencesInLine = line.match(/[^.!?]+[.!?]+|\s*\n\s*\n\s*|[^.!?]+$/g) || []

      sentencesInLine.forEach((sentence) => {
        segments.push(sentence.trim())
      })
    })

    return segments.filter(Boolean)
  }
}

/**
 * Join segments back into a single text
 */
export function joinSegments(segments: string[]): string {
  // Join segments with proper spacing
  let result = ""
  let lastSegmentEndsWithNewline = false

  segments.forEach((segment, index) => {
    if (!segment) {
      // Add a line break for empty segments
      result += "\n"
      lastSegmentEndsWithNewline = true
      return
    }

    if (index > 0 && !lastSegmentEndsWithNewline) {
      // Add space between segments if the last segment didn't end with a newline
      result += " "
    }

    result += segment
    lastSegmentEndsWithNewline = segment.endsWith("\n")
  })

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
}

export function createSegmentPairs(sourceSegments: string[], targetSegments: string[] = []): SegmentPair[] {
  return sourceSegments.map((source, index) => ({
    id: `segment-${index}`,
    source,
    target: targetSegments[index] || "",
    isTranslated: Boolean(targetSegments[index]),
  }))
}
