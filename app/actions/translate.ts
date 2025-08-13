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
  geminiModel = "gemini-1.5-flash",
  openaiModel = "gpt-4o",
  anthropicModel = "claude-3-5-sonnet-20241022",
) {
  if (!text.trim()) {
    return {
      success: false,
      message: "No text provided",
      error: ErrorService.createError(ERROR_TYPES.VALIDATION, "Texto vazio para tradução"),
    }
  }

  // Define provider priority order based on primary provider
  const getProviderOrder = (primaryProvider: string) => {
    const allProviders = ["gemini", "openai", "anthropic"]
    const otherProviders = allProviders.filter((p) => p !== primaryProvider)
    return [primaryProvider, ...otherProviders]
  }

  // Check which providers have API keys
  const availableProviders = []
  if (geminiApiKey) availableProviders.push("gemini")
  if (openaiApiKey) availableProviders.push("openai")
  if (anthropicApiKey) availableProviders.push("anthropic")

  if (availableProviders.length === 0) {
    return {
      success: false,
      message: "No API keys provided",
      error: ErrorService.createError(ERROR_TYPES.VALIDATION, "Nenhuma chave de API fornecida"),
    }
  }

  const providerOrder = getProviderOrder(provider).filter((p) => availableProviders.includes(p))
  const failedProviders: Array<{ provider: string; error: any }> = []

  console.log(`Tentando tradução com provedores na ordem: ${providerOrder.join(" → ")}`)

  // Try each provider in order until one succeeds
  for (const currentProvider of providerOrder) {
    console.log(`Tentando provedor: ${currentProvider}`)

    try {
      const result = await tryProvider(
        currentProvider as "gemini" | "openai" | "anthropic",
        text,
        sourceLang,
        targetLang,
        { geminiApiKey, openaiApiKey, anthropicApiKey },
        { geminiModel, openaiModel, anthropicModel },
      )

      if (result.success && result.translation) {
        console.log(`Sucesso com ${currentProvider}: "${result.translation.substring(0, 30)}..."`)
        return {
          ...result,
          usedProvider: currentProvider,
          fallbackUsed: currentProvider !== provider,
        }
      } else {
        failedProviders.push({ provider: currentProvider, error: result.error })
        console.log(`Falha com ${currentProvider}: ${result.message}`)
      }
    } catch (error) {
      const errorObj = ErrorService.createError(
        ERROR_TYPES.NETWORK,
        error instanceof Error ? error.message : "Erro desconhecido",
        { error },
      )
      failedProviders.push({ provider: currentProvider, error: errorObj })
      console.error(`Erro com ${currentProvider}:`, error)
    }
  }

  // All providers failed
  console.error("Todos os provedores falharam:", failedProviders)
  return {
    success: false,
    message: `Falha na tradução com todos os provedores disponíveis (${providerOrder.join(", ")})`,
    error: ErrorService.createError(ERROR_TYPES.API, "Todos os provedores falharam"),
    details: {
      failedProviders,
      triedProviders: providerOrder,
    },
  }
}

async function tryProvider(
  provider: "gemini" | "openai" | "anthropic",
  text: string,
  sourceLang: string,
  targetLang: string,
  apiKeys: { geminiApiKey?: string; openaiApiKey?: string; anthropicApiKey?: string },
  models: { geminiModel: string; openaiModel: string; anthropicModel: string },
) {
  switch (provider) {
    case "gemini":
      if (!apiKeys.geminiApiKey) {
        return {
          success: false,
          message: "Gemini API key is required",
          error: ErrorService.createError(ERROR_TYPES.VALIDATION, "Chave de API do Gemini não fornecida"),
        }
      }

      console.log(`Traduzindo com Gemini ${models.geminiModel}`)

      // Try with retries for Gemini
      let geminiError = null
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 0) {
          console.log(`Tentativa ${attempt + 1} com Gemini após falha anterior`)
          await wait(RETRY_DELAY * attempt)
        }

        try {
          const result = await translateWithGemini(
            text,
            sourceLang,
            targetLang,
            apiKeys.geminiApiKey,
            models.geminiModel,
          )
          if (result.success && result.translation) {
            return result
          } else {
            geminiError =
              result.error || ErrorService.createError(ERROR_TYPES.API, result.message || "Erro desconhecido")
          }
        } catch (error) {
          geminiError = ErrorService.createError(
            ERROR_TYPES.NETWORK,
            error instanceof Error ? error.message : "Erro desconhecido",
            { error },
          )
        }
      }

      return {
        success: false,
        message: `Gemini falhou após ${MAX_RETRIES + 1} tentativas`,
        error: geminiError,
      }

    case "openai":
      if (!apiKeys.openaiApiKey) {
        return {
          success: false,
          message: "OpenAI API key is required",
          error: ErrorService.createError(ERROR_TYPES.VALIDATION, "Chave de API do OpenAI não fornecida"),
        }
      }

      console.log(`Traduzindo com OpenAI ${models.openaiModel}`)
      return await translateWithOpenAI(text, sourceLang, targetLang, apiKeys.openaiApiKey, models.openaiModel)

    case "anthropic":
      if (!apiKeys.anthropicApiKey) {
        return {
          success: false,
          message: "Anthropic API key is required",
          error: ErrorService.createError(ERROR_TYPES.VALIDATION, "Chave de API da Anthropic não fornecida"),
        }
      }

      console.log(`Traduzindo com Anthropic ${models.anthropicModel}`)
      return await translateWithAnthropic(text, sourceLang, targetLang, apiKeys.anthropicApiKey, models.anthropicModel)

    default:
      return {
        success: false,
        message: "Provedor desconhecido",
        error: ErrorService.createError(ERROR_TYPES.VALIDATION, "Provedor desconhecido"),
      }
  }
}
