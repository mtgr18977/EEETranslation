// Utilitário simples para debug
export const DEBUG = {
  enabled: true,
  log: (...args: any[]) => {
    if (DEBUG.enabled) {
      console.log("[DEBUG]", ...args)
    }
  },
}
