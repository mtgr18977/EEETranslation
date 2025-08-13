/**
 * Serviço para interagir com a API do Gemini
 */

import { ERROR_TYPES } from "./constants"
import { ErrorService } from "./error-service"

const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

/**
 * Traduz texto usando a API do Gemini
 * @param text Texto a ser traduzido
 * @param sourceLang Idioma de origem
 * @param targetLang Idioma de destino
 * @param apiKey Chave de API do Gemini
 * @param model Modelo do Gemini a ser usado (opcional, padrão: gemini-1.5-flash)
 * @returns Objeto com o resultado da tradução
 */
export async function translateWithGemini(
  text: string,
  sourceLang: string,
  targetLang: string,
  apiKey: string,
  model = "gemini-1.5-flash",
) {
  if (!text.trim()) {
    return {
      success: false,
      message: "No text provided",
      error: ErrorService.createError(ERROR_TYPES.VALIDATION, "Texto vazio para tradução"),
    }
  }

  if (!apiKey) {
    return {
      success: false,
      message: "API key is required",
      error: ErrorService.createError(ERROR_TYPES.VALIDATION, "Chave de API do Gemini não fornecida"),
    }
  }

  try {
    // Obter os nomes dos idiomas para o prompt
    const sourceLanguageName = getLanguageName(sourceLang)
    const targetLanguageName = getLanguageName(targetLang)

    // Construir o prompt para o Gemini
    const prompt = `Traduza este texto do ${sourceLanguageName} para ${targetLanguageName}. Mantenha a formatação original, incluindo quebras de linha e espaços. Retorne apenas o texto traduzido, sem comentários adicionais:\n\n${text}`

    const apiUrl = `${GEMINI_API_BASE_URL}/${model}:generateContent?key=${apiKey}`

    // Fazer a requisição para a API do Gemini com o formato correto
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      }),
    })

    const data = await response.json()

    // Verificar se a resposta foi bem-sucedida
    if (response.ok && data.candidates && data.candidates.length > 0) {
      const translatedText = data.candidates[0].content.parts[0].text

      // Limpar qualquer texto explicativo que o modelo possa ter adicionado
      const cleanedTranslation = cleanTranslation(translatedText)

      return {
        success: true,
        translation: cleanedTranslation,
        provider: "gemini",
        model, // Include model in response
      }
    } else {
      console.error("Erro na API do Gemini:", data)
      return {
        success: false,
        message: `Erro na API do Gemini: ${JSON.stringify(data.error || "Erro desconhecido")}`,
        error: ErrorService.createError(
          ERROR_TYPES.API,
          `Erro na API do Gemini: ${data.error?.message || "Erro desconhecido"}`,
          data,
        ),
      }
    }
  } catch (error) {
    console.error("Erro ao chamar a API do Gemini:", error)
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

/**
 * Obtém o nome completo do idioma a partir do código
 */
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

/**
 * Limpa a tradução de possíveis textos explicativos adicionados pelo modelo
 */
function cleanTranslation(text: string): string {
  // Remover prefixos comuns que o modelo pode adicionar
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
