"use server"

// Configuração da API do Google Translate
const GOOGLE_API_KEY = "AIzaSyDXqtLBOcUi1iaQiBVu9HlQiCo5V3feIIQ"
const GOOGLE_API_URL = "https://translation.googleapis.com/language/translate/v2"

// Configuração da API LibreTranslate (fallback)
const LIBRE_API_URL = "https://libretranslate.de/translate"

// Configuração para tentativas
const MAX_RETRIES = 2
const RETRY_DELAY = 1000 // ms

// Função para esperar um tempo específico
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function translateText(text: string, sourceLang = "en", targetLang = "pt") {
  if (!text.trim()) return { success: false, message: "No text provided" }

  console.log(`Traduzindo texto: "${text.substring(0, 30)}..." de ${sourceLang} para ${targetLang}`)

  // Tentativas com Google Translate
  let googleError = null
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      console.log(`Tentativa ${attempt} com Google Translate após falha anterior`)
      await wait(RETRY_DELAY * attempt) // Espera progressivamente mais tempo entre tentativas
    }

    try {
      console.log(`Fazendo requisição para Google Translate (tentativa ${attempt + 1}/${MAX_RETRIES + 1})`)
      const response = await fetch(`${GOOGLE_API_URL}?key=${GOOGLE_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: text,
          source: sourceLang,
          target: targetLang,
          format: "text",
        }),
      })

      const data = await response.json()
      console.log(`Resposta do Google Translate (status ${response.status}):`, data)

      if (response.ok) {
        const translation = data.data?.translations?.[0]?.translatedText
        if (translation) {
          console.log(`Tradução recebida do Google: "${translation.substring(0, 30)}..."`)
          return {
            success: true,
            translation: translation,
            provider: "google",
          }
        } else {
          console.error("Resposta do Google sem tradução:", data)
          googleError = "Resposta sem tradução"
        }
      } else {
        console.error(`Erro na API do Google (${response.status}):`, data)
        googleError = `Erro ${response.status}: ${data.error?.message || "Desconhecido"}`
      }
    } catch (error) {
      console.error("Erro ao chamar Google Translate:", error)
      googleError = error instanceof Error ? error.message : "Erro desconhecido"
    }
  }

  console.log(`Google Translate falhou após ${MAX_RETRIES + 1} tentativas. Erro: ${googleError}`)
  console.log("Tentando LibreTranslate como fallback")

  // Tentativas com LibreTranslate
  let libreError = null
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      console.log(`Tentativa ${attempt} com LibreTranslate após falha anterior`)
      await wait(RETRY_DELAY * attempt)
    }

    try {
      console.log(`Fazendo requisição para LibreTranslate (tentativa ${attempt + 1}/${MAX_RETRIES + 1})`)
      const response = await fetch(LIBRE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: text,
          source: sourceLang,
          target: targetLang,
          format: "text",
        }),
      })

      const data = await response.json()
      console.log(`Resposta do LibreTranslate (status ${response.status}):`, data)

      if (response.ok) {
        const translation = data.translatedText
        if (translation) {
          console.log(`Tradução recebida do LibreTranslate: "${translation.substring(0, 30)}..."`)
          return {
            success: true,
            translation: translation,
            provider: "libre",
          }
        } else {
          console.error("Resposta do LibreTranslate sem tradução:", data)
          libreError = "Resposta sem tradução"
        }
      } else {
        console.error(`Erro na API do LibreTranslate (${response.status}):`, data)
        libreError = `Erro ${response.status}: ${data.error || "Desconhecido"}`
      }
    } catch (error) {
      console.error("Erro ao chamar LibreTranslate:", error)
      libreError = error instanceof Error ? error.message : "Erro desconhecido"
    }
  }

  console.log(`LibreTranslate também falhou após ${MAX_RETRIES + 1} tentativas. Erro: ${libreError}`)

  // Ambos os provedores falharam
  return {
    success: false,
    message: `Falha na tradução com ambos os provedores. Google: ${googleError}. LibreTranslate: ${libreError}`,
    details: {
      googleError,
      libreError,
    },
  }
}
