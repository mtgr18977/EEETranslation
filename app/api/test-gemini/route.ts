import { type NextRequest, NextResponse } from "next/server"
import { translateWithGemini } from "@/utils/gemini-service"

export async function POST(request: NextRequest) {
  try {
    const { text, sourceLang, targetLang, apiKey } = await request.json()

    if (!text || !sourceLang || !targetLang || !apiKey) {
      return NextResponse.json({ success: false, message: "Parâmetros incompletos" }, { status: 400 })
    }

    const result = await translateWithGemini(text, sourceLang, targetLang, apiKey)

    if (result.success) {
      return NextResponse.json({
        success: true,
        translation: result.translation,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message || "Erro na tradução",
          details: result.error,
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Erro no teste do Gemini:", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    )
  }
}
