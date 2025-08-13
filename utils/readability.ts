/**
 * Tipos de índices de leiturabilidade suportados
 */
export type ReadabilityIndex = "flesch" | "flesch-kincaid" | "coleman-liau" | "gunning-fog" | "smog"

/**
 * Resultado do cálculo de leiturabilidade
 */
export interface ReadabilityScore {
  score: number
  grade: string
  level: "very-easy" | "easy" | "medium" | "difficult" | "very-difficult"
}

/**
 * Resultado completo da análise de leiturabilidade
 */
export interface ReadabilityResult {
  flesch: ReadabilityScore
  fleschKincaid: ReadabilityScore
  colemanLiau: ReadabilityScore
  gunningFog: ReadabilityScore
  smog: ReadabilityScore
  averageGrade: number
}

/**
 * Conta o número de sílabas em uma palavra em inglês
 * Esta é uma implementação simplificada
 */
function countSyllablesEn(word: string): number {
  word = word.toLowerCase().trim()
  if (!word) return 0

  // Remover pontuação final
  word = word.replace(/[.,!?;:]$/, "")

  // Casos especiais
  if (word.length <= 3) return 1

  // Contar vogais
  const vowels = word.match(/[aeiouy]+/g)
  if (!vowels) return 1

  // Ajustes para padrões comuns em inglês
  let count = vowels.length

  // Vogais consecutivas contam como uma
  if (word.match(/[aeiouy]{2,}/g)) {
    count -= word.match(/[aeiouy]{2,}/g)!.length
  }

  // 'e' mudo no final não conta
  if (word.endsWith("e") && !word.endsWith("le")) {
    count--
  }

  // 'ed' no final geralmente não conta como sílaba
  if (word.endsWith("ed") && !word.match(/[td]ed$/)) {
    count--
  }

  // 'es' no final geralmente não conta como sílaba
  if (word.endsWith("es") && !word.match(/[sxz]es$/)) {
    count--
  }

  // 'y' no final geralmente conta como sílaba
  if (word.endsWith("y") && word.match(/[^aeiouy]y$/)) {
    count++
  }

  // Garantir pelo menos uma sílaba
  return Math.max(1, count)
}

/**
 * Conta o número de sílabas em uma palavra em português
 * Esta é uma implementação simplificada
 */
function countSyllablesPt(word: string): number {
  word = word.toLowerCase().trim()
  if (!word) return 0

  // Remover pontuação final
  word = word.replace(/[.,!?;:]$/, "")

  // Casos especiais
  if (word.length <= 2) return 1

  // Substituir combinações que formam uma única sílaba
  word = word
    .replace(/([aeiou][iu])/g, "V") // ditongos
    .replace(/([qg]u[eiaou])/g, "CV") // que, qui, gue, gui
    .replace(/([^aeiou][rl][aeiou])/g, "CV") // grupos consonantais com l/r
    .replace(/([^aeiou]h[aeiou])/g, "CV") // ch, lh, nh

  // Contar vogais restantes
  const vowels = word.match(/[aeiouáàâãéèêíìóòôõúùûç]/gi)
  if (!vowels) return 1

  // Ajustes para hiatos
  let count = vowels.length

  // Vogais consecutivas que não formam ditongo (hiatos)
  const hiatos = word.match(/[aeo][aeo]/gi)
  if (hiatos) {
    count += hiatos.length
  }

  // Garantir pelo menos uma sílaba
  return Math.max(1, count)
}

/**
 * Conta o número de sílabas em uma palavra, dependendo do idioma
 */
function countSyllables(word: string, lang: string): number {
  if (lang === "pt" || lang === "pt-BR" || lang === "pt-PT") {
    return countSyllablesPt(word)
  }
  return countSyllablesEn(word)
}

/**
 * Conta o número de frases em um texto
 */
function countSentences(text: string): number {
  // Contar frases terminadas por ., !, ? e seguidas por espaço ou fim de texto
  const sentences = text.match(/[^.!?]+[.!?](?:\s|$)/g)
  return sentences ? sentences.length : 1
}

/**
 * Conta o número de palavras em um texto
 */
function countWords(text: string): number {
  const words = text.match(/\b\w+\b/g)
  return words ? words.length : 0
}

/**
 * Conta o número de caracteres em um texto
 */
function countCharacters(text: string): number {
  return text.replace(/\s/g, "").length
}

/**
 * Conta o número de palavras complexas (3+ sílabas) em um texto
 */
function countComplexWords(text: string, lang: string): number {
  const words = text.match(/\b\w+\b/g) || []
  return words.filter((word) => countSyllables(word, lang) >= 3).length
}

/**
 * Calcula o índice de facilidade de leitura de Flesch
 * Adaptado para português e inglês
 */
function calculateFleschIndex(text: string, lang: string): ReadabilityScore {
  const sentences = countSentences(text)
  const words = countWords(text)
  const syllables = (text.match(/\b\w+\b/g) || []).reduce((total, word) => total + countSyllables(word, lang), 0)

  if (words === 0 || sentences === 0) {
    return { score: 100, grade: "N/A", level: "easy" }
  }

  let score: number

  if (lang === "pt" || lang === "pt-BR" || lang === "pt-PT") {
    // Adaptação para português (Martins et al., 1996)
    score = 248.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
  } else {
    // Fórmula original para inglês
    score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
  }

  // Limitar o score entre 0 e 100
  score = Math.max(0, Math.min(100, score))

  let grade: string
  let level: "very-easy" | "easy" | "medium" | "difficult" | "very-difficult"

  if (score >= 90) {
    grade = "5ª série"
    level = "very-easy"
  } else if (score >= 80) {
    grade = "6ª série"
    level = "easy"
  } else if (score >= 70) {
    grade = "7ª série"
    level = "easy"
  } else if (score >= 60) {
    grade = "8ª-9ª série"
    level = "medium"
  } else if (score >= 50) {
    grade = "Ensino Médio"
    level = "medium"
  } else if (score >= 30) {
    grade = "Universitário"
    level = "difficult"
  } else {
    grade = "Pós-graduação"
    level = "very-difficult"
  }

  return { score, grade, level }
}

/**
 * Calcula o índice de nível de escolaridade Flesch-Kincaid
 */
function calculateFleschKincaidGrade(text: string, lang: string): ReadabilityScore {
  const sentences = countSentences(text)
  const words = countWords(text)
  const syllables = (text.match(/\b\w+\b/g) || []).reduce((total, word) => total + countSyllables(word, lang), 0)

  if (words === 0 || sentences === 0) {
    return { score: 0, grade: "N/A", level: "easy" }
  }

  let score = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59

  // Ajuste para português, se necessário
  if (lang === "pt" || lang === "pt-BR" || lang === "pt-PT") {
    score = score * 1.15 // Ajuste aproximado para português
  }

  // Limitar o score para valores razoáveis
  score = Math.max(0, Math.min(18, score))

  let grade: string
  let level: "very-easy" | "easy" | "medium" | "difficult" | "very-difficult"

  if (score <= 5) {
    grade = "Ensino Fundamental I"
    level = "very-easy"
  } else if (score <= 8) {
    grade = "Ensino Fundamental II"
    level = "easy"
  } else if (score <= 12) {
    grade = "Ensino Médio"
    level = "medium"
  } else if (score <= 16) {
    grade = "Graduação"
    level = "difficult"
  } else {
    grade = "Pós-graduação"
    level = "very-difficult"
  }

  return { score, grade, level }
}

/**
 * Calcula o índice Coleman-Liau
 */
function calculateColemanLiauIndex(text: string): ReadabilityScore {
  const words = countWords(text)
  const characters = countCharacters(text)
  const sentences = countSentences(text)

  if (words === 0 || sentences === 0) {
    return { score: 0, grade: "N/A", level: "easy" }
  }

  const L = (characters / words) * 100
  const S = (sentences / words) * 100

  let score = 0.0588 * L - 0.296 * S - 15.8

  // Limitar o score para valores razoáveis
  score = Math.max(0, Math.min(18, score))

  let grade: string
  let level: "very-easy" | "easy" | "medium" | "difficult" | "very-difficult"

  if (score <= 5) {
    grade = "Ensino Fundamental I"
    level = "very-easy"
  } else if (score <= 8) {
    grade = "Ensino Fundamental II"
    level = "easy"
  } else if (score <= 12) {
    grade = "Ensino Médio"
    level = "medium"
  } else if (score <= 16) {
    grade = "Graduação"
    level = "difficult"
  } else {
    grade = "Pós-graduação"
    level = "very-difficult"
  }

  return { score, grade, level }
}

/**
 * Calcula o índice Gunning Fog
 */
function calculateGunningFogIndex(text: string, lang: string): ReadabilityScore {
  const sentences = countSentences(text)
  const words = countWords(text)
  const complexWords = countComplexWords(text, lang)

  if (words === 0 || sentences === 0) {
    return { score: 0, grade: "N/A", level: "easy" }
  }

  let score = 0.4 * (words / sentences + 100 * (complexWords / words))

  // Ajuste para português, se necessário
  if (lang === "pt" || lang === "pt-BR" || lang === "pt-PT") {
    score = score * 1.1 // Ajuste aproximado para português
  }

  // Limitar o score para valores razoáveis
  score = Math.max(0, Math.min(18, score))

  let grade: string
  let level: "very-easy" | "easy" | "medium" | "difficult" | "very-difficult"

  if (score <= 5) {
    grade = "Ensino Fundamental I"
    level = "very-easy"
  } else if (score <= 8) {
    grade = "Ensino Fundamental II"
    level = "easy"
  } else if (score <= 12) {
    grade = "Ensino Médio"
    level = "medium"
  } else if (score <= 16) {
    grade = "Graduação"
    level = "difficult"
  } else {
    grade = "Pós-graduação"
    level = "very-difficult"
  }

  return { score, grade, level }
}

/**
 * Calcula o índice SMOG (Simple Measure of Gobbledygook)
 */
function calculateSmogIndex(text: string, lang: string): ReadabilityScore {
  const sentences = countSentences(text)
  const complexWords = countComplexWords(text, lang)

  if (sentences < 3) {
    return { score: 0, grade: "N/A", level: "easy" }
  }

  let score = 1.043 * Math.sqrt(complexWords * (30 / sentences)) + 3.1291

  // Ajuste para português, se necessário
  if (lang === "pt" || lang === "pt-BR" || lang === "pt-PT") {
    score = score * 1.05 // Ajuste aproximado para português
  }

  // Limitar o score para valores razoáveis
  score = Math.max(0, Math.min(18, score))

  let grade: string
  let level: "very-easy" | "easy" | "medium" | "difficult" | "very-difficult"

  if (score <= 5) {
    grade = "Ensino Fundamental I"
    level = "very-easy"
  } else if (score <= 8) {
    grade = "Ensino Fundamental II"
    level = "easy"
  } else if (score <= 12) {
    grade = "Ensino Médio"
    level = "medium"
  } else if (score <= 16) {
    grade = "Graduação"
    level = "difficult"
  } else {
    grade = "Pós-graduação"
    level = "very-difficult"
  }

  return { score, grade, level }
}

/**
 * Calcula todos os índices de leiturabilidade para um texto
 */
export function calculateReadability(text: string, lang: string): ReadabilityResult {
  const flesch = calculateFleschIndex(text, lang)
  const fleschKincaid = calculateFleschKincaidGrade(text, lang)
  const colemanLiau = calculateColemanLiauIndex(text)
  const gunningFog = calculateGunningFogIndex(text, lang)
  const smog = calculateSmogIndex(text, lang)

  // Calcular a média dos scores (excluindo Flesch que tem escala diferente)
  const gradeScores = [fleschKincaid.score, colemanLiau.score, gunningFog.score, smog.score]

  const averageGrade = gradeScores.reduce((sum, score) => sum + score, 0) / gradeScores.length

  return {
    flesch,
    fleschKincaid,
    colemanLiau,
    gunningFog,
    smog,
    averageGrade,
  }
}

/**
 * Retorna a cor para um nível de leiturabilidade
 */
export function getReadabilityLevelColor(
  level: "very-easy" | "easy" | "medium" | "difficult" | "very-difficult",
): string {
  switch (level) {
    case "very-easy":
      return "bg-green-500"
    case "easy":
      return "bg-green-300"
    case "medium":
      return "bg-yellow-300"
    case "difficult":
      return "bg-orange-400"
    case "very-difficult":
      return "bg-red-500"
    default:
      return "bg-gray-300"
  }
}

/**
 * Retorna a descrição para um nível de leiturabilidade
 */
export function getReadabilityLevelDescription(
  level: "very-easy" | "easy" | "medium" | "difficult" | "very-difficult",
): string {
  switch (level) {
    case "very-easy":
      return "Muito fácil"
    case "easy":
      return "Fácil"
    case "medium":
      return "Médio"
    case "difficult":
      return "Difícil"
    case "very-difficult":
      return "Muito difícil"
    default:
      return "Desconhecido"
  }
}

/**
 * Get quick readability assessment with actionable insights
 */
export function getReadabilityInsights(
  text: string,
  lang: string,
): {
  level: "very-easy" | "easy" | "medium" | "difficult" | "very-difficult"
  score: number
  tips: string[]
  metrics: {
    avgWordsPerSentence: number
    avgSyllablesPerWord: number
    complexWordPercentage: number
  }
} {
  const readability = calculateReadability(text, lang)
  const words = countWords(text)
  const sentences = countSentences(text)
  const syllables = (text.match(/\b\w+\b/g) || []).reduce((total, word) => total + countSyllables(word, lang), 0)
  const complexWords = countComplexWords(text, lang)

  const metrics = {
    avgWordsPerSentence: words / sentences,
    avgSyllablesPerWord: syllables / words,
    complexWordPercentage: (complexWords / words) * 100,
  }

  const tips: string[] = []

  // Generate specific tips based on metrics
  if (metrics.avgWordsPerSentence > 20) {
    tips.push("Frases muito longas. Tente dividir em frases menores (máximo 15-20 palavras)")
  }

  if (metrics.complexWordPercentage > 15) {
    tips.push("Muitas palavras complexas. Substitua por sinônimos mais simples quando possível")
  }

  if (metrics.avgSyllablesPerWord > 2) {
    tips.push("Palavras com muitas sílabas. Use palavras mais curtas para melhorar a fluência")
  }

  if (readability.flesch.score < 30) {
    tips.push("Texto muito difícil. Considere reescrever com linguagem mais acessível")
  } else if (readability.flesch.score > 90) {
    tips.push("Texto muito simples. Pode ser adequado para público infantil")
  }

  if (tips.length === 0) {
    tips.push("Leiturabilidade adequada para o público-alvo")
  }

  return {
    level: readability.flesch.level,
    score: readability.flesch.score,
    tips,
    metrics,
  }
}

/**
 * Compare readability between two texts
 */
export function compareReadability(
  sourceText: string,
  targetText: string,
  sourceLang: string,
  targetLang: string,
): {
  sourceReadability: ReadabilityResult
  targetReadability: ReadabilityResult
  comparison: {
    fleschDifference: number
    levelChange: "improved" | "maintained" | "decreased"
    recommendation: string
  }
} {
  const sourceReadability = calculateReadability(sourceText, sourceLang)
  const targetReadability = calculateReadability(targetText, targetLang)

  const fleschDifference = targetReadability.flesch.score - sourceReadability.flesch.score

  let levelChange: "improved" | "maintained" | "decreased"
  let recommendation: string

  if (Math.abs(fleschDifference) < 5) {
    levelChange = "maintained"
    recommendation = "A leiturabilidade foi mantida na tradução"
  } else if (fleschDifference > 0) {
    levelChange = "improved"
    recommendation = "A tradução ficou mais fácil de ler que o original"
  } else {
    levelChange = "decreased"
    recommendation = "A tradução ficou mais difícil de ler. Considere simplificar"
  }

  return {
    sourceReadability,
    targetReadability,
    comparison: {
      fleschDifference,
      levelChange,
      recommendation,
    },
  }
}
