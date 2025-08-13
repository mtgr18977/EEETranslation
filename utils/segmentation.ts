/**
 * Split text into segments (sentences or paragraphs)
 */
export function splitIntoSegments(text: string, segmentType: "sentence" | "paragraph" = "sentence"): string[] {
  if (!text || !text.trim()) return []

  if (segmentType === "paragraph") {
    // Split by paragraphs (double line breaks)
    const paragraphs = text.split(/\n\s*\n/)
    return paragraphs.map((p) => p.trim()).filter((p) => p !== "")
  } else {
    // Abordagem simplificada para sentenças
    // Primeiro, preservar quebras de linha substituindo-as por um marcador especial
    const LINE_BREAK_MARKER = "___LINE_BREAK___"
    const textWithMarkers = text.replace(/\n/g, LINE_BREAK_MARKER)

    // Dividir por sentenças
    const sentenceRegex = /[^.!?]+[.!?]+|[^.!?]+$/g
    const matches = textWithMarkers.match(sentenceRegex) || []

    // Processar cada sentença e restaurar quebras de linha
    const segments: string[] = []

    for (const match of matches) {
      if (match.includes(LINE_BREAK_MARKER)) {
        // Se a sentença contém quebras de linha, dividi-la
        const parts = match.split(LINE_BREAK_MARKER)

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i].trim()
          if (part) segments.push(part)

          // Adicionar quebra de linha após cada parte exceto a última
          if (i < parts.length - 1) {
            segments.push("\n")
          }
        }
      } else {
        // Sentença normal sem quebras de linha
        segments.push(match.trim())
      }
    }

    return segments.filter(Boolean)
  }
}

/**
 * Join segments back into a single text
 */
export function joinSegments(segments: string[]): string {
  if (!segments || segments.length === 0) return ""

  // Juntar segmentos com espaçamento adequado
  let result = ""

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]

    // Tratar quebras de linha
    if (segment === "\n") {
      result += "\n"
      continue
    }

    // Adicionar espaço entre segmentos se necessário
    if (i > 0 && segments[i - 1] !== "\n" && !result.endsWith("\n")) {
      result += " "
    }

    result += segment
  }

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
}

export function createSegmentPairs(sourceSegments: string[], targetSegments: string[] = []): SegmentPair[] {
  return sourceSegments.map((source, index) => {
    const isLineBreak = source === "\n"

    return {
      id: `segment-${index}`,
      source: isLineBreak ? "" : source,
      target: targetSegments[index] || (isLineBreak ? "\n" : ""),
      isTranslated: Boolean(targetSegments[index]) || isLineBreak,
      isLineBreak,
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
