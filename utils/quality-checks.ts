/**
 * Tipos de problemas de qualidade que podem ser detectados
 */
export type QualityIssueType =
  | "missing-number"
  | "different-number"
  | "missing-tag"
  | "malformed-tag"
  | "missing-punctuation"
  | "length-ratio"
  | "untranslated-term"

/**
 * Representa um problema de qualidade encontrado na tradução
 */
export interface QualityIssue {
  type: QualityIssueType
  description: string
  sourceText?: string
  targetText?: string
  severity: "warning" | "error"
  position?: {
    start: number
    end: number
  }
}

/**
 * Verifica números ausentes ou diferentes entre o texto fonte e o texto traduzido
 */
function checkNumbers(source: string, target: string): QualityIssue[] {
  const issues: QualityIssue[] = []

  // Encontrar todos os números no texto fonte
  const sourceNumbers = source.match(/\b\d+(?:[.,]\d+)*\b/g) || []
  const targetNumbers = target.match(/\b\d+(?:[.,]\d+)*\b/g) || []

  // Verificar números ausentes
  for (const num of sourceNumbers) {
    if (!targetNumbers.includes(num)) {
      issues.push({
        type: "missing-number",
        description: `Número "${num}" presente no texto fonte não foi encontrado na tradução`,
        sourceText: num,
        severity: "error",
      })
    }
  }

  // Verificar números extras ou diferentes
  for (const num of targetNumbers) {
    if (!sourceNumbers.includes(num)) {
      issues.push({
        type: "different-number",
        description: `Número "${num}" presente na tradução não foi encontrado no texto fonte`,
        targetText: num,
        severity: "warning",
      })
    }
  }

  return issues
}

/**
 * Verifica tags HTML/Markdown ausentes ou mal formadas
 */
function checkTags(source: string, target: string): QualityIssue[] {
  const issues: QualityIssue[] = []

  // Regex para encontrar tags HTML e Markdown comuns
  const tagRegex = /<[^>]+>|\*\*.*?\*\*|__.*?__|_.*?_|\*.*?\*|`.*?`|\[.*?\]$$.*?$$/g

  // Encontrar todas as tags no texto fonte
  const sourceTags: string[] = []
  let match
  while ((match = tagRegex.exec(source)) !== null) {
    sourceTags.push(match[0])
  }

  // Encontrar todas as tags no texto alvo
  const targetTags: string[] = []
  tagRegex.lastIndex = 0 // Resetar o índice do regex
  while ((match = tagRegex.exec(target)) !== null) {
    targetTags.push(match[0])
  }

  // Verificar tags ausentes
  for (const tag of sourceTags) {
    if (!target.includes(tag)) {
      issues.push({
        type: "missing-tag",
        description: `Tag "${tag}" presente no texto fonte não foi encontrada na tradução`,
        sourceText: tag,
        severity: "error",
      })
    }
  }

  // Verificar tags mal formadas (simplificado - em um sistema real seria mais complexo)
  const htmlOpenTagRegex = /<([a-z][a-z0-9]*)[^>]*>/gi
  const htmlCloseTagRegex = /<\/([a-z][a-z0-9]*)>/gi

  const sourceOpenTags: string[] = []
  const sourceCloseTags: string[] = []

  htmlOpenTagRegex.lastIndex = 0
  while ((match = htmlOpenTagRegex.exec(source)) !== null) {
    sourceOpenTags.push(match[1].toLowerCase())
  }

  htmlCloseTagRegex.lastIndex = 0
  while ((match = htmlCloseTagRegex.exec(source)) !== null) {
    sourceCloseTags.push(match[1].toLowerCase())
  }

  const targetOpenTags: string[] = []
  const targetCloseTags: string[] = []

  htmlOpenTagRegex.lastIndex = 0
  while ((match = htmlOpenTagRegex.exec(target)) !== null) {
    targetOpenTags.push(match[1].toLowerCase())
  }

  htmlCloseTagRegex.lastIndex = 0
  while ((match = htmlCloseTagRegex.exec(target)) !== null) {
    targetCloseTags.push(match[1].toLowerCase())
  }

  // Verificar se o número de tags de abertura e fechamento corresponde
  for (const tag of [...new Set(sourceOpenTags)]) {
    const sourceOpenCount = sourceOpenTags.filter((t) => t === tag).length
    const sourceCloseCount = sourceCloseTags.filter((t) => t === tag).length
    const targetOpenCount = targetOpenTags.filter((t) => t === tag).length
    const targetCloseCount = targetCloseTags.filter((t) => t === tag).length

    if (sourceOpenCount === sourceCloseCount && targetOpenCount !== targetCloseCount) {
      issues.push({
        type: "malformed-tag",
        description: `Tag "${tag}" está mal formada na tradução (abertura/fechamento não correspondem)`,
        severity: "error",
      })
    }
  }

  return issues
}

/**
 * Verifica pontuação ausente ou inconsistente
 */
function checkPunctuation(source: string, target: string): QualityIssue[] {
  const issues: QualityIssue[] = []

  // Verificar pontuação final
  const sourceFinalPunct = source.match(/[.!?]$/)
  const targetFinalPunct = target.match(/[.!?]$/)

  if (sourceFinalPunct && !targetFinalPunct) {
    issues.push({
      type: "missing-punctuation",
      description: "Pontuação final ausente na tradução",
      severity: "warning",
    })
  }

  // Verificar contagem de pontuação importante
  const countPunctuation = (text: string, punct: string): number => {
    return (text.match(new RegExp(`\\${punct}`, "g")) || []).length
  }

  const punctuationMarks = ["?", "!", ":", ";"]

  for (const punct of punctuationMarks) {
    const sourceCount = countPunctuation(source, punct)
    const targetCount = countPunctuation(target, punct)

    if (sourceCount > 0 && targetCount === 0) {
      issues.push({
        type: "missing-punctuation",
        description: `Pontuação "${punct}" presente no texto fonte não foi encontrada na tradução`,
        severity: "warning",
      })
    }
  }

  return issues
}

/**
 * Verifica se o comprimento da tradução está dentro de limites razoáveis
 */
function checkLength(source: string, target: string): QualityIssue[] {
  const issues: QualityIssue[] = []

  // Ignorar verificação para textos muito curtos
  if (source.length < 10) return issues

  const ratio = target.length / source.length

  // A tradução é muito mais curta que o original (pode indicar conteúdo faltando)
  if (ratio < 0.5) {
    issues.push({
      type: "length-ratio",
      description: "A tradução é significativamente mais curta que o texto original",
      severity: "warning",
    })
  }

  // A tradução é muito mais longa que o original (pode indicar verbosidade excessiva)
  if (ratio > 2.0) {
    issues.push({
      type: "length-ratio",
      description: "A tradução é significativamente mais longa que o texto original",
      severity: "warning",
    })
  }

  return issues
}

/**
 * Verifica termos que não devem ser traduzidos
 */
function checkUntranslatedTerms(source: string, target: string): QualityIssue[] {
  // Esta é uma implementação simplificada
  // Em um sistema real, isso seria conectado a um glossário ou a uma lista de termos
  const issues: QualityIssue[] = []

  // Lista de termos técnicos comuns que geralmente não são traduzidos
  const technicalTerms = [
    "API",
    "HTML",
    "CSS",
    "JavaScript",
    "React",
    "Vue",
    "Angular",
    "Node.js",
    "TypeScript",
    "Docker",
    "Kubernetes",
    "Git",
  ]

  for (const term of technicalTerms) {
    if (source.includes(term) && !target.includes(term)) {
      issues.push({
        type: "untranslated-term",
        description: `Termo técnico "${term}" não foi preservado na tradução`,
        sourceText: term,
        severity: "warning",
      })
    }
  }

  return issues
}

/**
 * Executa todas as verificações de qualidade em um par de segmentos
 */
export function runQualityChecks(source: string, target: string): QualityIssue[] {
  // Se não houver texto alvo, não há problemas para reportar
  if (!target.trim()) return []

  return [
    ...checkNumbers(source, target),
    ...checkTags(source, target),
    ...checkPunctuation(source, target),
    ...checkLength(source, target),
    ...checkUntranslatedTerms(source, target),
  ]
}

/**
 * Retorna a cor de severidade para um tipo de problema
 */
export function getSeverityColor(severity: "warning" | "error"): string {
  return severity === "error" ? "text-red-500" : "text-amber-500"
}

/**
 * Retorna o ícone para um tipo de problema
 */
export function getIssueTypeIcon(type: QualityIssueType): string {
  switch (type) {
    case "missing-number":
    case "different-number":
      return "123"
    case "missing-tag":
    case "malformed-tag":
      return "code"
    case "missing-punctuation":
      return "type"
    case "length-ratio":
      return "ruler"
    case "untranslated-term":
      return "book"
    default:
      return "alert-circle"
  }
}
