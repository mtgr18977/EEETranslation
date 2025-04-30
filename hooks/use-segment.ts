"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useKeyboardShortcuts } from "@/contexts/keyboard-shortcuts-context"
import { translateText } from "@/app/actions/translate"
import { runQualityChecks, type QualityIssue } from "@/utils/quality-checks"
import { findGlossaryTerms } from "@/utils/glossary"
import type { SegmentPair } from "@/utils/segmentation"
import type { GlossaryTerm } from "@/utils/glossary"

interface UseSegmentProps {
  segment: SegmentPair
  onUpdateSegment: (id: string, translation: string) => void
  sourceLang: string
  targetLang: string
  isActive: boolean
  glossaryTerms: GlossaryTerm[]
  apiSettings?: { libreApiUrl?: string }
}

export function useSegment({
  segment,
  onUpdateSegment,
  sourceLang,
  targetLang,
  isActive,
  glossaryTerms,
  apiSettings,
}: UseSegmentProps) {
  // Estado local
  const [isTranslating, setIsTranslating] = useState(false)
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"edit" | "align">("edit")
  const [localText, setLocalText] = useState(segment.target)
  const [qualityIssues, setQualityIssues] = useState<QualityIssue[]>([])
  const [highlightedTerms, setHighlightedTerms] = useState<{ term: GlossaryTerm; index: number }[]>([])
  const [translationError, setTranslationError] = useState<string | null>(null)

  // Obter contexto de atalhos de teclado
  const { registerShortcutHandler, unregisterShortcutHandler } = useKeyboardShortcuts()

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previousSegmentId = useRef(segment.id)

  // Atualizar texto local quando o segmento muda
  useEffect(() => {
    if (previousSegmentId.current !== segment.id) {
      setLocalText(segment.target)
      previousSegmentId.current = segment.id
    }
  }, [segment.id, segment.target])

  // Verificar qualidade quando o texto muda
  useEffect(() => {
    if (segment.target.trim()) {
      const issues = runQualityChecks(segment.source, segment.target)
      setQualityIssues(issues)
    } else {
      setQualityIssues([])
    }
  }, [segment.source, segment.target])

  // Encontrar termos do glossário no texto fonte
  useEffect(() => {
    if (glossaryTerms.length > 0 && segment.source) {
      const terms = findGlossaryTerms(segment.source, glossaryTerms)
      setHighlightedTerms(terms)
    } else {
      setHighlightedTerms([])
    }
  }, [segment.source, glossaryTerms])

  // Focar o textarea quando o segmento fica ativo
  useEffect(() => {
    if (isActive && viewMode === "edit" && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isActive, viewMode])

  // Handlers
  async function handleTranslate() {
    if (!segment.source.trim() || isTranslating) return

    setIsTranslating(true)
    setTranslationError(null)

    try {
      // Obter a URL da API do LibreTranslate das props
      const libreApiUrl = apiSettings?.libreApiUrl

      const result = await translateText(segment.source, sourceLang, targetLang, libreApiUrl)

      if (result.success && result.translation) {
        setSuggestion(result.translation)
      } else {
        setTranslationError(result.message || "Falha na tradução. Tente novamente.")
      }
    } catch (error) {
      console.error("Translation error:", error)
      setTranslationError("Ocorreu um erro durante a tradução. Tente novamente.")
    } finally {
      setIsTranslating(false)
    }
  }

  function handleApplySuggestion() {
    if (suggestion) {
      setLocalText(suggestion)
      onUpdateSegment(segment.id, suggestion)
      setSuggestion(null)
    }
  }

  function handleRejectSuggestion() {
    setSuggestion(null)
  }

  function handleViewModeChange(mode: "edit" | "align") {
    // Salvar mudanças antes de mudar de visualização
    if (localText !== segment.target) {
      onUpdateSegment(segment.id, localText)
    }

    setViewMode(mode)
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newText = e.target.value
    setLocalText(newText)
  }

  // Nova função para copiar o texto fonte para o alvo
  function handleCopySourceToTarget() {
    if (segment.source) {
      setLocalText(segment.source)
      onUpdateSegment(segment.id, segment.source)

      // Mostrar feedback visual (opcional)
      if (textareaRef.current) {
        textareaRef.current.classList.add("bg-green-100")
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.classList.remove("bg-green-100")
          }
        }, 300)
      }
    }
  }

  // Registrar atalhos de teclado específicos para este segmento quando estiver ativo
  useEffect(() => {
    if (isActive) {
      // Registrar atalhos específicos para este segmento
      if (suggestion) {
        registerShortcutHandler("applySuggestion", handleApplySuggestion)
        registerShortcutHandler("rejectSuggestion", handleRejectSuggestion)
      }

      registerShortcutHandler("suggestTranslation", handleTranslate)
      registerShortcutHandler("toggleAlignView", () => handleViewModeChange(viewMode === "edit" ? "align" : "edit"))
      registerShortcutHandler("copySourceToTarget", handleCopySourceToTarget)

      return () => {
        // Limpar os handlers quando o componente for desmontado ou não estiver mais ativo
        if (suggestion) {
          unregisterShortcutHandler("applySuggestion")
          unregisterShortcutHandler("rejectSuggestion")
        }
        unregisterShortcutHandler("suggestTranslation")
        unregisterShortcutHandler("toggleAlignView")
        unregisterShortcutHandler("copySourceToTarget")
      }
    }
  }, [isActive, suggestion, registerShortcutHandler, unregisterShortcutHandler, viewMode, segment.source])

  return {
    isTranslating,
    suggestion,
    viewMode,
    localText,
    qualityIssues,
    highlightedTerms,
    translationError,
    textareaRef,
    handleTranslate,
    handleApplySuggestion,
    handleRejectSuggestion,
    handleViewModeChange,
    handleTextChange,
    handleCopySourceToTarget,
  }
}
