"use server"

import { ERROR_TYPES } from "@/utils/constants"
import { ErrorService } from "@/utils/error-service"
import { translateWithGemini } from "@/utils/gemini-service"
import { translateWithOpenAI } from "@/utils/openai-service"
import { translateWithAnthropic } from "@/utils/anthropic-service"

// Configuração para tentativas
const MAX_RETRIES = 2
const RETRY_DELAY = 1000 // ms

// Função para esperar um tempo específico
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function translateText(
  text: string,
  sourceLang = "en",
  targetLang = "pt",
  geminiApiKey?: string,
  openaiApiKey?: string,
  anthropicApiKey?: string,
  provider: "gemini" | "openai" | "anthropic" = "gemini",
) {
  if (!text.trim()) {
    return {
      success: false,
      message: "No text provided",
      error: ErrorService.createError(ERROR_TYPES.VALIDATION, "Texto vazio para tradução"),
    }
  }

  let result

  switch (provider) {
    case "gemini":
      if (!geminiApiKey) {
        return {
          success: false,
          message: "API key is required",
          error: ErrorService.createError(
            ERROR_TYPES.VALIDATION,
            "Chave de API do Gemini não fornecida",
          ),
        }
      }

    console.log(
      `Traduzindo texto: "${text.substring(0, 30)}..." de ${sourceLang} para ${targetLang} usando Gemini`,
    )

    let geminiError = null
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        console.log(`Tentativa ${attempt} com Gemini após falha anterior`)
        await wait(RETRY_DELAY * attempt)
      }

      try {
        console.log(
          `Fazendo requisição para Gemini (tentativa ${attempt + 1}/${MAX_RETRIES + 1})`,
        )
        result = await translateWithGemini(text, sourceLang, targetLang, geminiApiKey)
        if (result.success && result.translation) {
          console.log(`Tradução recebida do Gemini: "${result.translation.substring(0, 30)}..."`)
          return result
        } else {
          console.error("Erro na tradução com Gemini:", result.message)
          geminiError = result.error || ErrorService.createError(
            ERROR_TYPES.API,
            result.message || "Erro desconhecido",
          )
        }
      } catch (error) {
        console.error("Erro ao chamar Gemini:", error)
        geminiError = ErrorService.createError(
          ERROR_TYPES.NETWORK,
          error instanceof Error ? error.message : "Erro desconhecido",
          { error },
        )
      }
    }

    console.log(`Gemini falhou após ${MAX_RETRIES + 1} tentativas. Erro:`, geminiError)
      break

    case "openai":
      if (!openaiApiKey) {
        return {
          success: false,
          message: "API key is required",
          error: ErrorService.createError(
            ERROR_TYPES.VALIDATION,
            "Chave de API do OpenAI não fornecida",
          ),
        }
      }

      console.log(
        `Traduzindo texto: "${text.substring(0, 30)}..." de ${sourceLang} para ${targetLang} usando OpenAI`,
      )
      result = await translateWithOpenAI(text, sourceLang, targetLang, openaiApiKey)
      if (result.success && result.translation) {
        return result
      }
      console.error("Falha na tradução com OpenAI:", result.message)
      break

    case "anthropic":
      if (!anthropicApiKey) {
        return {
          success: false,
          message: "API key is required",
          error: ErrorService.createError(
            ERROR_TYPES.VALIDATION,
            "Chave de API da Anthropic não fornecida",
          ),
        }
      }

    console.log(
      `Traduzindo texto: "${text.substring(0, 30)}..." de ${sourceLang} para ${targetLang} usando Anthropic`,
    )
      result = await translateWithAnthropic(text, sourceLang, targetLang, anthropicApiKey)
      if (result.success && result.translation) {
        return result
      }
      console.error("Falha na tradução com Anthropic:", result.message)
      break

    default:
      return {
        success: false,
        message: "Provedor desconhecido",
        error: ErrorService.createError(ERROR_TYPES.VALIDATION, "Provedor desconhecido"),
      }
  }

  return {
    success: false,
    message: "Falha na tradução com o provedor selecionado.",
    error: ErrorService.createError(
      ERROR_TYPES.API,
      "Falha na tradução",
    ),
  }
}
