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
    // Split by sentences
    // This is a simplified sentence splitter - production systems would use more sophisticated NLP
    const segments = text.match(/[^.!?]+[.!?]+|\s*\n\s*\n\s*|[^.!?]+$/g) || []
    return segments.map((s) => s.trim()).filter(Boolean)
  }
}

/**
 * Join segments back into a single text
 */
export function joinSegments(segments: string[]): string {
  // Preserve line breaks within segments
  return segments.join("\n\n")
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
