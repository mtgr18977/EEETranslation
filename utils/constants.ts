// Constantes para armazenamento local
export const STORAGE_KEYS = {
  API_SETTINGS: "translation-platform-api-settings",
  USER_PREFERENCES: "translation-platform-preferences",
  RECENT_PROJECTS: "translation-platform-recent-projects",
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
