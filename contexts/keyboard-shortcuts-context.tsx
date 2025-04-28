"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"

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
  activeSegmentId: string | null
  setActiveSegmentId: (id: string | null) => void
  registerShortcutHandler: (action: ShortcutAction, handler: () => void) => void
  unregisterShortcutHandler: (action: ShortcutAction) => void
  isShortcutsModalOpen: boolean
  setShortcutsModalOpen: (isOpen: boolean) => void
}

const defaultShortcuts: ShortcutMapping[] = [
  {
    action: "nextSegment",
    key: "ArrowDown",
    description: "Move to next segment",
    category: "navigation",
  },
  {
    action: "prevSegment",
    key: "ArrowUp",
    description: "Move to previous segment",
    category: "navigation",
  },
  {
    action: "nextUntranslated",
    key: "n",
    altKey: true,
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
]

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | undefined>(undefined)

export function KeyboardShortcutsProvider({ children }) {
  const [shortcuts] = useState(defaultShortcuts)
  const [activeSegmentId, setActiveSegmentId] = useState(null)
  const [shortcutHandlers, setShortcutHandlers] = useState({
    nextSegment: null,
    prevSegment: null,
    nextUntranslated: null,
    suggestTranslation: null,
    applySuggestion: null,
    rejectSuggestion: null,
    toggleAlignView: null,
    focusTargetText: null,
    saveTranslation: null,
    showShortcuts: null,
  })
  const [isShortcutsModalOpen, setShortcutsModalOpen] = useState(false)

  // Memoize these functions to prevent them from changing on every render
  const registerShortcutHandler = useCallback((action, handler) => {
    setShortcutHandlers((prev) => {
      // Only update if the handler is different
      if (prev[action] === handler) return prev
      return { ...prev, [action]: handler }
    })
  }, [])

  const unregisterShortcutHandler = useCallback((action) => {
    setShortcutHandlers((prev) => {
      // Only update if there was a handler
      if (prev[action] === null) return prev
      return { ...prev, [action]: null }
    })
  }, [])

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        // Allow Escape key to work even in input fields
        if (event.key !== "Escape") {
          return
        }
      }

      // Special case for the shortcuts modal
      if (event.key === "?" && event.shiftKey) {
        setShortcutsModalOpen(true)
        event.preventDefault()
        return
      }

      // Check if the key combination matches any of our shortcuts
      for (const shortcut of shortcuts) {
        if (
          event.key === shortcut.key &&
          !!event.ctrlKey === !!shortcut.ctrlKey &&
          !!event.altKey === !!shortcut.altKey &&
          !!event.shiftKey === !!shortcut.shiftKey
        ) {
          const handler = shortcutHandlers[shortcut.action]
          if (handler) {
            handler()
            event.preventDefault()
            return
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [shortcuts, shortcutHandlers])

  return (
    <KeyboardShortcutsContext.Provider
      value={{
        shortcuts,
        activeSegmentId,
        setActiveSegmentId,
        registerShortcutHandler,
        unregisterShortcutHandler,
        isShortcutsModalOpen,
        setShortcutsModalOpen,
      }}
    >
      {children}
    </KeyboardShortcutsContext.Provider>
  )
}

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutsContext)
  if (context === undefined) {
    throw new Error("useKeyboardShortcuts must be used within a KeyboardShortcutsProvider")
  }
  return context
}
