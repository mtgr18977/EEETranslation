"use server"

// Configuração da API do Google Translate
const GOOGLE_API_KEY = "AIzaSyDXqtLBOcUi1iaQiBVu9HlQiCo5V3feIIQ"
const GOOGLE_API_URL = "https://translation.googleapis.com/language/translate/v2"

// Configuração da API LibreTranslate (fallback)
const LIBRE_API_URL = "https://libretranslate.de/translate"

export async function translateText(text: string, sourceLang = "en", targetLang = "pt") {
  if (!text.trim()) return { success: false, message: "No text provided" }

  console.log(`Traduzindo texto: "${text.substring(0, 30)}..." de ${sourceLang} para ${targetLang}`)

  // Primeiro, tente com a API do Google
  try {
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

    if (response.ok) {
      const translation = data.data.translations[0].translatedText
      console.log(`Tradução recebida (Google): "${translation.substring(0, 30)}..."`)
      return {
        success: true,
        translation: translation,
        provider: "google",
      }
    }

    console.log("Google API falhou, tentando LibreTranslate como fallback")
    // Se a API do Google falhar, não retorne erro ainda, tente o fallback
  } catch (error) {
    console.error("Google Translation error:", error)
    console.log("Tentando LibreTranslate como fallback após erro")
    // Continue para o fallback
  }

  // Fallback: LibreTranslate
  try {
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
    console.log("Resposta da LibreTranslate API:", data)

    if (!response.ok) {
      console.error("LibreTranslate API error:", data)
      return {
        success: false,
        message: data.error?.message || "Translation failed with both providers",
      }
    }

    const translation = data.translatedText
    console.log(`Tradução recebida (LibreTranslate): "${translation.substring(0, 30)}..."`)

    return {
      success: true,
      translation: translation,
      provider: "libre",
    }
  } catch (error) {
    console.error("LibreTranslate error:", error)
    return {
      success: false,
      message: "An error occurred during translation with both providers",
    }
  }
}
