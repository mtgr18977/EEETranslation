"use server"

// In a real application, you would use environment variables for these
const API_KEY = "AIzaSyDXqtLBOcUi1iaQiBVu9HlQiCo5V3feIIQ"
const API_URL = "https://translation.googleapis.com/language/translate/v2"

export async function translateText(text: string, sourceLang = "en", targetLang = "pt") {
  if (!text.trim()) return { success: false, message: "No text provided" }

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

    if (!response.ok) {
      console.error("Translation API error:", data)
      return {
        success: false,
        message: data.error?.message || "Translation failed",
      }
    }

    return {
      success: true,
      translation: data.data.translations[0].translatedText,
    }
  } catch (error) {
    console.error("Translation error:", error)
    return {
      success: false,
      message: "An error occurred during translation",
    }
  }
}
