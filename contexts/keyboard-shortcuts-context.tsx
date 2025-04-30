"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from "react"

type ShortcutAction =
  | "nextSegment"
  | "prevSegment"
  | "nextUntranslated"
  | "suggestTranslation"
  | "applySuggestion"
  | "rejectSuggestion"
  | "toggleAlignView"
  | "focusTargetText"
  | "saveTranslation"
  | "showShortcuts"
  | "copySourceToTarget"

interface ShortcutMapping {
  action: ShortcutAction
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  description: string
  category: "navigation" | "translation" | "view" | "general"
}

interface KeyboardShortcutsContextType {
  shortcuts: ShortcutMapping[]
  registerShortcutHandler: (action: ShortcutAction, handler: () => void) => void
  unregisterShortcutHandler: (action: ShortcutAction) => void
  isShortcutsModalOpen: boolean
  setShortcutsModalOpen: (isOpen: boolean) => void
}

const defaultShortcuts: ShortcutMapping[] = [
  {
    action: "nextSegment",
    key: "j",
    description: "Move to next segment",
    category: "navigation",
  },
  {
    action: "prevSegment",
    key: "k",
    description: "Move to previous segment",
    category: "navigation",
  },
  {
    action: "nextUntranslated",
    key: "Enter",
    ctrlKey: true,
    description: "Jump to next untranslated segment",
    category: "navigation",
  },
  {
    action: "suggestTranslation",
    key: "t",
    altKey: true,
    description: "Suggest translation for current segment",
    category: "translation",
  },
  {
    action: "applySuggestion",
    key: "Enter",
    altKey: true,
    description: "Apply translation suggestion",
    category: "translation",
  },
  {
    action: "rejectSuggestion",
    key: "Escape",
    description: "Reject translation suggestion",
    category: "translation",
  },
  {
    action: "toggleAlignView",
    key: "a",
    altKey: true,
    description: "Toggle alignment view",
    category: "view",
  },
  {
    action: "focusTargetText",
    key: "Tab",
    description: "Focus on target text area",
    category: "navigation",
  },
  {
    action: "saveTranslation",
    key: "s",
    ctrlKey: true,
    description: "Save translation",
    category: "general",
  },
  {
    action: "showShortcuts",
    key: "?",
    shiftKey: true,
    description: "Show keyboard shortcuts",
    category: "general",
  },
  {
    action: "copySourceToTarget",
    key: "c",
    ctrlKey: true,
    altKey: true,
    description: "Copy source text to target",
    category: "translation",
  },
]

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | undefined>(undefined)

export function KeyboardShortcutsProvider({ children }) {
  // Memoize shortcuts para evitar recriações
  const shortcuts = useMemo(() => defaultShortcuts, [])
  const [isShortcutsModalOpen, setShortcutsModalOpen] = useState(false)

  // Use um ref para armazenar handlers para evitar re-renders
  const handlersRef = useRef<Record<string, () => void>>({})

  // Memoize estas funções para evitar que elas mudem a cada renderização
  const registerShortcutHandler = useCallback((action: ShortcutAction, handler: () => void) => {
    handlersRef.current[action] = handler
  }, [])

  const unregisterShortcutHandler = useCallback((action: ShortcutAction) => {
    delete handlersRef.current[action]
  }, [])

  // Manipulador de eventos de teclado global
  useEffect(() => {
    // Criar um mapa de atalhos para pesquisa rápida
    const shortcutMap = new Map<string, ShortcutMapping>()

    shortcuts.forEach((shortcut) => {
      const key = `${shortcut.key}-${shortcut.ctrlKey || false}-${shortcut.altKey || false}-${shortcut.shiftKey || false}`
      shortcutMap.set(key, shortcut)
    })

    function handleKeyDown(event: KeyboardEvent) {
      // Não acionar atalhos ao digitar em campos de entrada
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        // Permitir tecla Escape mesmo em campos de entrada
        if (event.key !== "Escape") {
          // Exceção para Ctrl+Enter (próximo não traduzido) e Ctrl+Alt+C (copiar source para target)
          // que devem funcionar mesmo em campos de texto
          const isCtrlEnter = event.ctrlKey && event.key === "Enter"
          const isCtrlAltC = event.ctrlKey && event.altKey && event.key === "c"

          if (!isCtrlEnter && !isCtrlAltC) {
            return
          }
        }
      }

      // Caso especial para o modal de atalhos
      if (event.key === "?" && event.shiftKey) {
        event.preventDefault()
        setShortcutsModalOpen(true)
        return
      }

      // Verificar se a combinação de teclas corresponde a algum dos nossos atalhos
      const lookupKey = `${event.key}-${event.ctrlKey}-${event.altKey}-${event.shiftKey}`
      const shortcut = shortcutMap.get(lookupKey)

      if (shortcut) {
        const handler = handlersRef.current[shortcut.action]
        if (handler) {
          event.preventDefault()
          handler()
        }
      }
    }

    // Usar document em vez de window para capturar eventos em todo o documento
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [shortcuts, setShortcutsModalOpen])

  // Memoize o valor do contexto para evitar renderizações desnecessárias
  const contextValue = useMemo(
    () => ({
      shortcuts,
      registerShortcutHandler,
      unregisterShortcutHandler,
      isShortcutsModalOpen,
      setShortcutsModalOpen,
    }),
    [shortcuts, registerShortcutHandler, unregisterShortcutHandler, isShortcutsModalOpen, setShortcutsModalOpen],
  )

  return <KeyboardShortcutsContext.Provider value={contextValue}>{children}</KeyboardShortcutsContext.Provider>
}

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutsContext)
  if (context === undefined) {
    throw new Error("useKeyboardShortcuts must be used within a KeyboardShortcutsProvider")
  }
  return context
}
