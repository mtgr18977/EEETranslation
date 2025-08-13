// Utilitário simples para debug
export const DEBUG = {
  enabled: false, // Desativado temporariamente
  log: (...args: any[]) => {
    if (DEBUG.enabled) {
      console.log("[DEBUG]", ...args)
    }
  },
}
