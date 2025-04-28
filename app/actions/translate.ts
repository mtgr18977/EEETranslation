"use server"

// In a real application, you would use environment variables for these
const API_KEY = "AIzaSyDXqtLBOcUi1iaQiBVu9HlQiCo5V3feIIQ"
const API_URL = "https://translation.googleapis.com/language/translate/v2"

// Vamos adicionar logs de depuração à função translateText para verificar se está funcionando corretamente

// Substitua a função translateText por esta versão:
export async function translateText(text: string, sourceLang = "en", targetLang = "pt") {
  if (!text.trim()) return { success: false, message: "No text provided" }

  console.log(`Traduzindo texto: "${text.substring(0, 30)}..." de ${sourceLang} para ${targetLang}`)

  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
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
    console.log("Resposta da API:", data)

    if (!response.ok) {
      console.error("Translation API error:", data)
      return {
        success: false,
        message: data.error?.message || "Translation failed",
      }
    }

    const translation = data.data.translations[0].translatedText
    console.log(`Tradução recebida: "${translation.substring(0, 30)}..."`)

    return {
      success: true,
      translation: translation,
    }
  } catch (error) {
    console.error("Translation error:", error)
    return {
      success: false,
      message: "An error occurred during translation",
    }
  }
}
