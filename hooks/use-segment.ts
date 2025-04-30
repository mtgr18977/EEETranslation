"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { useKeyboardShortcuts } from "@/contexts/keyboard-shortcuts-context"
import { translateText } from "@/app/actions/translate"
import { runQualityChecks, type QualityIssue } from "@/utils/quality-checks"
import { findGlossaryTerms } from "@/utils/glossary"
import type { SegmentPair } from "@/utils/segmentation"
import type { GlossaryTerm } from "@/utils/glossary"
import { useDebounce } from "./use-debounce"

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

  // Debounce do texto local para evitar verificações de qualidade em cada digitação
  const debouncedLocalText = useDebounce(localText, 500)

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

  // Verificar qualidade quando o texto debounced muda
  useEffect(() => {
    if (debouncedLocalText.trim() && segment.source) {
      // Executar verificações de qualidade em um timeout para não bloquear a UI
      const timeoutId = setTimeout(() => {
        const issues = runQualityChecks(segment.source, debouncedLocalText)
        setQualityIssues(issues)
      }, 0)

      return () => clearTimeout(timeoutId)
    } else {
      setQualityIssues([])
    }
  }, [debouncedLocalText, segment.source])

  // Encontrar termos do glossário no texto fonte - memoizado para evitar recálculos
  useEffect(() => {
    if (glossaryTerms.length === 0 || !segment.source) {
      setHighlightedTerms([])
      return
    }

    // Executar em um timeout para não bloquear a UI
    const timeoutId = setTimeout(() => {
      const terms = findGlossaryTerms(segment.source, glossaryTerms)
      setHighlightedTerms(terms)
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [segment.source, glossaryTerms])

  // Focar o textarea quando o segmento fica ativo
  useEffect(() => {
    if (isActive && viewMode === "edit" && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isActive, viewMode])

  // Handlers memoizados para evitar recriações desnecessárias
  const handleTranslate = useCallback(async () => {
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
  }, [segment.source, sourceLang, targetLang, apiSettings?.libreApiUrl, isTranslating])

  const handleApplySuggestion = useCallback(() => {
    if (suggestion) {
      setLocalText(suggestion)
      onUpdateSegment(segment.id, suggestion)
      setSuggestion(null)
    }
  }, [suggestion, segment.id, onUpdateSegment])

  const handleRejectSuggestion = useCallback(() => {
    setSuggestion(null)
  }, [])

  const handleViewModeChange = useCallback(
    (mode: "edit" | "align") => {
      // Salvar mudanças antes de mudar de visualização
      if (localText !== segment.target) {
        onUpdateSegment(segment.id, localText)
      }

      setViewMode(mode)
    },
    [localText, segment.target, segment.id, onUpdateSegment],
  )

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setLocalText(newText)
  }, [])

  // Nova função para copiar o texto fonte para o alvo
  const handleCopySourceToTarget = useCallback(() => {
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
  }, [segment.source, segment.id, onUpdateSegment])

  // Função para salvar o texto quando o usuário sai do campo
  const handleBlur = useCallback(() => {
    if (localText !== segment.target) {
      onUpdateSegment(segment.id, localText)
    }
  }, [localText, segment.target, segment.id, onUpdateSegment])

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
  }, [
    isActive,
    suggestion,
    registerShortcutHandler,
    unregisterShortcutHandler,
    viewMode,
    handleApplySuggestion,
    handleRejectSuggestion,
    handleTranslate,
    handleViewModeChange,
    handleCopySourceToTarget,
  ])

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
    handleBlur,
  }
}
