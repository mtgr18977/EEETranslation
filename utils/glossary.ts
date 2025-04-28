export interface GlossaryTerm {
  term: string
  definition: string
  relatedUrl?: string
  relatedName?: string
}

export async function loadGlossaryFromCSV(url: string): Promise<GlossaryTerm[]> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch glossary: ${response.status} ${response.statusText}`)
    }

    const csvText = await response.text()
    const terms: GlossaryTerm[] = []

    // Parse CSV
    const lines = csvText.split("\n")

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Handle CSV properly (accounting for quoted fields with commas)
      const values: string[] = []
      let currentValue = ""
      let inQuotes = false

      for (let j = 0; j < line.length; j++) {
        const char = line[j]

        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === "," && !inQuotes) {
          values.push(currentValue)
          currentValue = ""
        } else {
          currentValue += char
        }
      }

      // Add the last value
      values.push(currentValue)

      // Create term object
      if (values.length >= 2) {
        terms.push({
          term: values[0].replace(/^"|"$/g, "").trim(),
          definition: values[1].replace(/^"|"$/g, "").trim(),
          relatedUrl: values[2]?.replace(/^"|"$/g, "").trim() || undefined,
          relatedName: values[3]?.replace(/^"|"$/g, "").trim() || undefined,
        })
      }
    }

    return terms
  } catch (error) {
    console.error("Error loading glossary:", error)
    return []
  }
}

/**
 * Find glossary terms in a text
 */
export function findGlossaryTerms(
  text: string,
  glossaryTerms: GlossaryTerm[],
): { term: GlossaryTerm; index: number }[] {
  if (!text || !glossaryTerms.length) return []

  const results: { term: GlossaryTerm; index: number }[] = []

  // Sort terms by length (longest first) to ensure we match the most specific terms first
  const sortedTerms = [...glossaryTerms].sort((a, b) => b.term.length - a.term.length)

  for (const term of sortedTerms) {
    // Create a regex that matches whole words only
    const regex = new RegExp(`\\b${escapeRegExp(term.term)}\\b`, "gi")
    let match

    while ((match = regex.exec(text)) !== null) {
      results.push({
        term,
        index: match.index,
      })
    }
  }

  // Sort by index to maintain order in the text
  return results.sort((a, b) => a.index - b.index)
}

/**
 * Escape special characters in a string for use in a regular expression
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Check if a term is properly translated
 */
export function checkTermTranslation(sourceTerm: string, targetText: string, expectedTranslation?: string): boolean {
  if (!targetText) return false
  if (!expectedTranslation) return true // If no expected translation, we can't check

  // Create a regex that matches whole words only
  const regex = new RegExp(`\\b${escapeRegExp(expectedTranslation)}\\b`, "i")
  return regex.test(targetText)
}
