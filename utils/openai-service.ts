import { ERROR_TYPES } from "./constants"
import { ErrorService } from "./error-service"

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
const OPENAI_MODEL = "gpt-4o"

export async function translateWithOpenAI(
  text: string,
  sourceLang: string,
  targetLang: string,
  apiKey: string,
) {
  if (!text.trim()) {
    return {
      success: false,
      message: "No text provided",
      error: ErrorService.createError(
        ERROR_TYPES.VALIDATION,
        "Texto vazio para tradução",
      ),
    }
  }

  if (!apiKey) {
    return {
      success: false,
      message: "API key is required",
      error: ErrorService.createError(
        ERROR_TYPES.VALIDATION,
        "Chave de API do OpenAI não fornecida",
      ),
    }
  }

  try {
    const sourceLanguageName = getLanguageName(sourceLang)
    const targetLanguageName = getLanguageName(targetLang)

    const prompt = `Traduza este texto do ${sourceLanguageName} para ${targetLanguageName}. Mantenha a formatação original, incluindo quebras de linha e espaços. Retorne apenas o texto traduzido, sem comentários adicionais:\n\n${text}`

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 8192,
      }),
    })

    const data = await response.json()

    if (response.ok && data.choices && data.choices.length > 0) {
      const translatedText = data.choices[0].message.content as string
      const cleanedTranslation = cleanTranslation(translatedText)
      return { success: true, translation: cleanedTranslation, provider: "openai" }
    } else {
      console.error("Erro na API do OpenAI:", data)
      return {
        success: false,
        message: `Erro na API do OpenAI: ${JSON.stringify(data.error || "Erro desconhecido")}`,
        error: ErrorService.createError(
          ERROR_TYPES.API,
          `Erro na API do OpenAI: ${data.error?.message || "Erro desconhecido"}`,
          data,
        ),
      }
    }
  } catch (error) {
    console.error("Erro ao chamar a API do OpenAI:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      error: ErrorService.createError(
        ERROR_TYPES.NETWORK,
        error instanceof Error ? error.message : "Erro desconhecido",
        { error },
      ),
    }
  }
}

function getLanguageName(langCode: string): string {
  const languageMap: Record<string, string> = {
    en: "inglês",
    pt: "português",
    es: "espanhol",
    fr: "francês",
    de: "alemão",
    it: "italiano",
    ja: "japonês",
    zh: "chinês",
    ru: "russo",
    ar: "árabe",
  }

  return languageMap[langCode] || langCode
}

function cleanTranslation(text: string): string {
  const prefixesToRemove = [
    "Aqui está a tradução:",
    "Tradução:",
    "Texto traduzido:",
    "Here's the translation:",
    "Translation:",
    "Translated text:",
  ]

  let cleanedText = text.trim()

  for (const prefix of prefixesToRemove) {
    if (cleanedText.startsWith(prefix)) {
      cleanedText = cleanedText.substring(prefix.length).trim()
    }
  }

  return cleanedText
}
