import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Extrair os dados da solicitação
    const requestData = await request.json()

    // Obter a URL do LibreTranslate dos parâmetros ou usar o padrão
    const libreApiUrl = requestData.apiUrl || "https://pt.libretranslate.com/translate"

    // Remover o campo apiUrl antes de encaminhar para o LibreTranslate
    const { apiUrl, ...dataToForward } = requestData

    console.log(`[Proxy] Encaminhando solicitação para: ${libreApiUrl}`)
    console.log(`[Proxy] Dados: ${JSON.stringify(dataToForward)}`)

    // Fazer a solicitação para o LibreTranslate
    const response = await fetch(libreApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Adicionar cabeçalhos que podem ser necessários
        Origin: new URL(libreApiUrl).origin,
      },
      body: JSON.stringify(dataToForward),
    })

    // Obter os dados da resposta
    const responseData = await response.json()

    console.log(`[Proxy] Resposta recebida (status ${response.status}):`, responseData)

    // Retornar a resposta com os mesmos dados e status
    return NextResponse.json(responseData, {
      status: response.status,
    })
  } catch (error) {
    console.error("[Proxy] Erro:", error)

    // Retornar erro em caso de falha
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro desconhecido no proxy" },
      { status: 500 },
    )
  }
}
