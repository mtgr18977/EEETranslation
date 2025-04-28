/**
 * Split text into segments (sentences or paragraphs)
 */
export function splitIntoSegments(text: string, segmentType: "sentence" | "paragraph" = "sentence"): string[] {
  if (!text.trim()) return []

  if (segmentType === "paragraph") {
    // Split by paragraphs (double line breaks)
    const paragraphs = text.split(/\n\s*\n/)
    return paragraphs.map((p) => p.trim()).filter((p) => p !== "")
  } else {
    // Abordagem mais robusta para segmentação por sentenças
    // Primeiro, dividimos o texto em linhas
    const lines = text.split(/\n/)
    const segments: string[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Se a linha estiver vazia, adicionamos um segmento vazio para preservar a quebra de linha
      if (!line.trim()) {
        segments.push("\n")
        continue
      }

      // Dividir a linha em sentenças
      // Usamos uma regex que captura sentenças terminadas por ., ! ou ?
      const sentenceMatches = line.match(/[^.!?]+[.!?]+|\s*\n\s*\n\s*|[^.!?]+$/g)

      if (sentenceMatches) {
        for (const sentence of sentenceMatches) {
          if (sentence.trim()) {
            segments.push(sentence.trim())
          }
        }
      } else if (line.trim()) {
        // Se não encontramos sentenças mas a linha não está vazia, adicionamos a linha inteira
        segments.push(line.trim())
      }

      // Adicionamos uma quebra de linha após cada linha, exceto a última
      if (i < lines.length - 1) {
        segments.push("\n")
      }
    }

    return segments
  }
}

/**
 * Join segments back into a single text
 */
export function joinSegments(segments: string[]): string {
  if (!segments.length) return ""

  // Abordagem simplificada: apenas concatenar os segmentos
  // Isso funciona porque preservamos as quebras de linha como segmentos separados
  return segments
    .join(" ")
    .replace(/\s+\n\s+/g, "\n")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Create a mapping between source and target segments
 */
export interface SegmentPair {
  id: string
  source: string
  target: string
  isTranslated: boolean
  isLineBreak?: boolean // Novo campo para identificar quebras de linha
}

export function createSegmentPairs(sourceSegments: string[], targetSegments: string[] = []): SegmentPair[] {
  return sourceSegments.map((source, index) => {
    // Identificar se este segmento é uma quebra de linha
    const isLineBreak = source === "\n"

    return {
      id: `segment-${index}`,
      source: isLineBreak ? "" : source, // Não mostramos "\n" como texto fonte
      target: targetSegments[index] || "",
      isTranslated: Boolean(targetSegments[index]),
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
