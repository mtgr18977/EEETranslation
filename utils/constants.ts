// Constantes para armazenamento local
export const STORAGE_KEYS = {
  API_SETTINGS: "translation-platform-api-settings",
  USER_PREFERENCES: "translation-platform-preferences",
  RECENT_PROJECTS: "translation-platform-recent-projects",
  CURRENT_PROJECT: "translation-platform-current-project",
  TRANSLATION_HISTORY: "translation-platform-history",
}

// Idiomas suportados
export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "pt", name: "Portuguese" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "ja", name: "Japanese" },
  { code: "zh", name: "Chinese" },
  { code: "ru", name: "Russian" },
  { code: "ar", name: "Arabic" },
]

// URLs padrão
export const DEFAULT_URLS = {
  LIBRE_TRANSLATE: "https://pt.libretranslate.com/translate",
  GLOSSARY:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/knowledge-share-terms-2025-04-28-w7A52xOLZShJKyLh1KN2WzIPADca84.csv",
}

// Configurações padrão
export const DEFAULT_SETTINGS = {
  API: {
    googleApiKey: "",
    libreApiUrl: DEFAULT_URLS.LIBRE_TRANSLATE,
    useLocalStorage: true,
  },
}

// Tipos de erro
export const ERROR_TYPES = {
  NETWORK: "network",
  VALIDATION: "validation",
  AUTHENTICATION: "authentication",
  PERMISSION: "permission",
  NOT_FOUND: "not_found",
  SERVER: "server",
  UNKNOWN: "unknown",
  TRANSLATION: "translation",
  STORAGE: "storage",
}

// Mensagens de erro
export const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: "Erro de conexão. Verifique sua internet.",
  [ERROR_TYPES.VALIDATION]: "Dados inválidos. Verifique os campos e tente novamente.",
  [ERROR_TYPES.AUTHENTICATION]: "Erro de autenticação. Faça login novamente.",
  [ERROR_TYPES.PERMISSION]: "Você não tem permissão para realizar esta ação.",
  [ERROR_TYPES.NOT_FOUND]: "Recurso não encontrado.",
  [ERROR_TYPES.SERVER]: "Erro no servidor. Tente novamente mais tarde.",
  [ERROR_TYPES.UNKNOWN]: "Ocorreu um erro desconhecido.",
  [ERROR_TYPES.TRANSLATION]: "Erro ao traduzir o texto. Tente novamente.",
  [ERROR_TYPES.STORAGE]: "Erro ao salvar os dados localmente.",
}
