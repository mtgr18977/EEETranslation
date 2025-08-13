import { ERROR_TYPES, ERROR_MESSAGES } from "./constants"

export interface AppError {
  type: string
  message: string
  details?: any
  timestamp: number
  code?: string
}

export class ErrorService {
  static createError(type: string, message?: string, details?: any, code?: string): AppError {
    return {
      type,
      message: message || ERROR_MESSAGES[type] || ERROR_MESSAGES.UNKNOWN,
      details,
      timestamp: Date.now(),
      code,
    }
  }

  static handleApiError(error: any): AppError {
    // Erros de rede (sem conexão)
    if (!navigator.onLine || error.name === "NetworkError") {
      return this.createError(ERROR_TYPES.NETWORK)
    }

    // Erros de API com resposta
    if (error.response) {
      const status = error.response.status

      // Erros comuns de API
      if (status === 400) {
        return this.createError(ERROR_TYPES.VALIDATION, "Requisição inválida", error.response.data)
      } else if (status === 401) {
        return this.createError(ERROR_TYPES.AUTHENTICATION, "Autenticação necessária", error.response.data)
      } else if (status === 403) {
        return this.createError(ERROR_TYPES.PERMISSION, "Permissão negada", error.response.data)
      } else if (status === 404) {
        return this.createError(ERROR_TYPES.NOT_FOUND, "Recurso não encontrado", error.response.data)
      } else if (status >= 500) {
        return this.createError(ERROR_TYPES.SERVER, "Erro no servidor", error.response.data)
      }
    }

    // Erro genérico
    return this.createError(ERROR_TYPES.UNKNOWN, error.message || "Ocorreu um erro desconhecido", error)
  }

  static logError(error: AppError): void {
    console.error(`[${error.type.toUpperCase()}] ${error.message}`, error.details || "")

    // Aqui você poderia enviar o erro para um serviço de monitoramento como Sentry
  }
}
