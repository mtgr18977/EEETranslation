"use client"

import { useMemo, useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import SegmentTranslator from "./segment-translator"
import { createSegmentPairs, joinSegments, type SegmentPair, splitIntoSegments } from "@/utils/segmentation"
import { Loader2, Keyboard, AlertCircle, AlertTriangle, CheckCircle, Filter } from "lucide-react"
import { translateText } from "@/app/actions/translate"
import { Progress } from "@/components/ui/progress"
import AlignmentLegend from "./alignment-legend"
import { useKeyboardShortcuts } from "@/contexts/keyboard-shortcuts-context"
import KeyboardShortcutsModal from "./keyboard-shortcuts-modal"
import { runQualityChecks } from "@/utils/quality-checks"

interface SegmentedTranslatorProps {
  sourceText: string
  targetText: string
  onUpdateTargetText: (text: string) => void
  sourceLang: string
  targetLang: string
}

type QualityFilter = "all" | "errors" | "warnings" | "clean" | "untranslated"

export default function SegmentedTranslator({
  sourceText,
  targetText,
  onUpdateTargetText,
  sourceLang,
  targetLang,
}: SegmentedTranslatorProps) {
  // Estado básico
  const [segmentType, setSegmentType] = useState<"sentence" | "paragraph">("sentence")
  const [segments, setSegments] = useState<SegmentPair[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isBatchTranslating, setIsBatchTranslating] = useState(false)
  const [translationProgress, setTranslationProgress] = useState(0)
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null)
  const [qualityFilter, setQualityFilter] = useState<QualityFilter>("all")

  // Refs para controle de estado
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const sourceTextRef = useRef(sourceText)
  const targetTextRef = useRef(targetText)

  // Obter contexto de atalhos de teclado
  const { registerShortcutHandler, unregisterShortcutHandler, setShortcutsModalOpen } = useKeyboardShortcuts()

  // Processar texto em segmentos quando o texto fonte ou tipo de segmento muda
  useEffect(() => {
    // Pular se nada mudou
    if (sourceText === sourceTextRef.current && targetText === targetTextRef.current && segments.length > 0) {
      return
    }

    setIsProcessing(true)
    sourceTextRef.current = sourceText
    targetTextRef.current = targetText

    // Usar setTimeout para evitar bloqueio da UI
    const timeoutId = setTimeout(() => {
      try {
        const sourceSegments = splitIntoSegments(sourceText, segmentType)
        const targetSegments = targetText ? splitIntoSegments(targetText, segmentType) : []

        const newSegments = createSegmentPairs(sourceSegments, targetSegments)

        // Filtrar quebras de linha para exibição
        const displayableSegments = newSegments.filter((s) => !s.isLineBreak)

        setSegments(newSegments)

        // Definir o primeiro segmento como ativo se nenhum estiver ativo
        if (displayableSegments.length > 0 && !activeSegmentId) {
          setActiveSegmentId(displayableSegments[0].id)
        }
      } catch (error) {
        console.error("Error processing segments:", error)
      } finally {
        setIsProcessing(false)
      }
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [sourceText, targetText, segmentType, activeSegmentId])

  // Função para atualizar o texto alvo com debounce
  const updateTargetTextWithDebounce = useCallback(
    (newSegments: SegmentPair[]) => {
      // Limpar timeout anterior se existir
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }

      // Definir novo timeout
      updateTimeoutRef.current = setTimeout(() => {
        try {
          // Extrair texto alvo dos segmentos
          const targetSegments = newSegments.map((s) => s.target)
          const newTargetText = joinSegments(targetSegments)

          onUpdateTargetText(newTargetText)
        } catch (error) {
          console.error("Error updating target text:", error)
        }
      }, 500)
    },
    [onUpdateTargetText],
  )

  // Manipular atualização de segmento
  const handleUpdateSegment = useCallback(
    (id: string, translation: string) => {
      setSegments((prev) => {
        // Encontrar o segmento a ser atualizado
        const segmentIndex = prev.findIndex((s) => s.id === id)
        if (segmentIndex === -1) return prev

        const segmentToUpdate = prev[segmentIndex]

        // Pular quebras de linha
        if (segmentToUpdate.isLineBreak) return prev

        // Se a tradução não mudou, não atualizar
        if (segmentToUpdate.target === translation) return prev

        // Criar novo array com o segmento atualizado
        const newSegments = [...prev]
        newSegments[segmentIndex] = {
          ...segmentToUpdate,
          target: translation,
          isTranslated: Boolean(translation.trim()),
        }

        // Agendar atualização do texto alvo
        updateTargetTextWithDebounce(newSegments)

        return newSegments
      })
    },
    [updateTargetTextWithDebounce],
  )

  // Manipuladores de navegação
  const handleNextSegment = useCallback(() => {
    if (!activeSegmentId || segments.length === 0) return

    // Encontrar segmentos exibíveis (não quebras de linha)
    const displayableSegments = segments.filter((s) => !s.isLineBreak)

    const currentIndex = displayableSegments.findIndex((s) => s.id === activeSegmentId)
    if (currentIndex < displayableSegments.length - 1) {
      const nextSegment = displayableSegments[currentIndex + 1]
      setActiveSegmentId(nextSegment.id)
    }
  }, [activeSegmentId, segments])

  const handlePrevSegment = useCallback(() => {
    if (!activeSegmentId || segments.length === 0) return

    // Encontrar segmentos exibíveis (não quebras de linha)
    const displayableSegments = segments.filter((s) => !s.isLineBreak)

    const currentIndex = displayableSegments.findIndex((s) => s.id === activeSegmentId)
    if (currentIndex > 0) {
      const prevSegment = displayableSegments[currentIndex - 1]
      setActiveSegmentId(prevSegment.id)
    }
  }, [activeSegmentId, segments])

  const handleNextUntranslated = useCallback(() => {
    if (segments.length === 0) return

    // Encontrar segmentos exibíveis (não quebras de linha)
    const displayableSegments = segments.filter((s) => !s.isLineBreak)

    const currentIndex = activeSegmentId ? displayableSegments.findIndex((s) => s.id === activeSegmentId) : -1

    // Encontrar o próximo segmento não traduzido
    for (let i = currentIndex + 1; i < displayableSegments.length; i++) {
      if (!displayableSegments[i].isTranslated) {
        setActiveSegmentId(displayableSegments[i].id)
        return
      }
    }

    // Se não encontrado após a posição atual, começar do início
    if (currentIndex > 0) {
      for (let i = 0; i < currentIndex; i++) {
        if (!displayableSegments[i].isTranslated) {
          setActiveSegmentId(displayableSegments[i].id)
          return
        }
      }
    }
  }, [activeSegmentId, segments])

  // Manipulador de salvamento de tradução
  const handleSaveTranslation = useCallback(() => {
    // Forçar uma atualização para acionar o useEffect
    const targetSegments = segments.map((s) => s.target)
    const newTargetText = joinSegments(targetSegments)
    onUpdateTargetText(newTargetText)
    alert("Translation saved!")
  }, [segments, onUpdateTargetText])

  // Registrar atalhos de teclado globais
  useEffect(() => {
    // Registrar manipuladores
    registerShortcutHandler("nextSegment", handleNextSegment)
    registerShortcutHandler("prevSegment", handlePrevSegment)
    registerShortcutHandler("nextUntranslated", handleNextUntranslated)
    registerShortcutHandler("saveTranslation", handleSaveTranslation)

    // Função de limpeza
    return () => {
      unregisterShortcutHandler("nextSegment")
      unregisterShortcutHandler("prevSegment")
      unregisterShortcutHandler("nextUntranslated")
      unregisterShortcutHandler("saveTranslation")
    }
  }, [
    registerShortcutHandler,
    unregisterShortcutHandler,
    handleNextSegment,
    handlePrevSegment,
    handleNextUntranslated,
    handleSaveTranslation,
  ])

  // Manipular tradução em lote
  const handleTranslateAll = async () => {
    const untranslatedSegments = segments.filter((s) => !s.isTranslated && s.source.trim() && !s.isLineBreak)
    if (untranslatedSegments.length === 0) return

    setIsBatchTranslating(true)
    setTranslationProgress(0)

    try {
      for (let i = 0; i < untranslatedSegments.length; i++) {
        const segment = untranslatedSegments[i]

        const result = await translateText(segment.source, sourceLang, targetLang)

        if (result.success && result.translation) {
          handleUpdateSegment(segment.id, result.translation)
        }

        setTranslationProgress(Math.round(((i + 1) / untranslatedSegments.length) * 100))
      }
    } catch (error) {
      console.error("Batch translation error:", error)
    } finally {
      setIsBatchTranslating(false)

      // Forçar uma atualização para acionar o useEffect
      const targetSegments = segments.map((s) => s.target)
      const newTargetText = joinSegments(targetSegments)
      onUpdateTargetText(newTargetText)
    }
  }

  // Filtrar segmentos com base na qualidade
  const filteredSegments = useMemo(() => {
    // Primeiro filtrar quebras de linha
    const displayableSegments = segments.filter((s) => !s.isLineBreak)

    if (qualityFilter === "all") {
      return displayableSegments
    }

    return displayableSegments.filter((segment) => {
      if (!segment.target.trim()) {
        return qualityFilter === "untranslated"
      }

      const issues = runQualityChecks(segment.source, segment.target)

      switch (qualityFilter) {
        case "errors":
          return issues.some((issue) => issue.severity === "error")
        case "warnings":
          return (
            !issues.some((issue) => issue.severity === "error") && issues.some((issue) => issue.severity === "warning")
          )
        case "clean":
          return issues.length === 0
        default:
          return true
      }
    })
  }, [segments, qualityFilter])

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Processing segments...</span>
      </div>
    )
  }

  if (!sourceText.trim()) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Enter or upload source text to begin translation
        </CardContent>
      </Card>
    )
  }

  // Contar apenas segmentos reais (não quebras de linha)
  const displayableSegments = segments.filter((s) => !s.isLineBreak)
  const untranslatedCount = displayableSegments.filter((s) => !s.isTranslated && s.source.trim()).length
  const totalSegments = displayableSegments.filter((s) => s.source.trim()).length
  const translatedPercent =
    totalSegments > 0 ? Math.round(((totalSegments - untranslatedCount) / totalSegments) * 100) : 0

  // Calcular estatísticas de qualidade
  const qualityStats = {
    errorCount: 0,
    warningCount: 0,
    cleanCount: 0,
  }

  displayableSegments.forEach((segment) => {
    if (!segment.target.trim()) return

    const issues = runQualityChecks(segment.source, segment.target)

    if (issues.some((issue) => issue.severity === "error")) {
      qualityStats.errorCount++
    } else if (issues.some((issue) => issue.severity === "warning")) {
      qualityStats.warningCount++
    } else {
      qualityStats.cleanCount++
    }
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">Segment by:</span>
          <Select value={segmentType} onValueChange={(value) => setSegmentType(value as "sentence" | "paragraph")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sentence">Sentence</SelectItem>
              <SelectItem value="paragraph">Paragraph</SelectItem>
            </SelectContent>
          </Select>

          <AlignmentLegend />

          <Button variant="outline" size="sm" className="h-8" onClick={() => setShortcutsModalOpen(true)}>
            <Keyboard className="h-4 w-4 mr-1" />
            Shortcuts
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm">
            {totalSegments - untranslatedCount}/{totalSegments} segments translated ({translatedPercent}%)
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTranslateAll}
            disabled={untranslatedCount === 0 || isBatchTranslating}
          >
            {isBatchTranslating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                Translating...
              </>
            ) : (
              `Translate All (${untranslatedCount})`
            )}
          </Button>
        </div>
      </div>

      {isBatchTranslating && (
        <div className="space-y-1">
          <Progress value={translationProgress} className="h-2" />
          <div className="text-xs text-right text-muted-foreground">{translationProgress}%</div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Filtrar por qualidade:</span>
          <Select value={qualityFilter} onValueChange={(value) => setQualityFilter(value as QualityFilter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os segmentos</SelectItem>
              <SelectItem value="errors">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                  Erros ({qualityStats.errorCount})
                </div>
              </SelectItem>
              <SelectItem value="warnings">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                  Avisos ({qualityStats.warningCount})
                </div>
              </SelectItem>
              <SelectItem value="clean">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Sem problemas ({qualityStats.cleanCount})
                </div>
              </SelectItem>
              <SelectItem value="untranslated">
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 text-blue-500" />
                  Não traduzidos ({untranslatedCount})
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          {filteredSegments.length} {filteredSegments.length === 1 ? "segmento" : "segmentos"} exibidos
        </div>
      </div>

      <div className="space-y-2">
        {filteredSegments.map((segment, index) => (
          <SegmentTranslator
            key={segment.id}
            segment={segment}
            onUpdateSegment={handleUpdateSegment}
            sourceLang={sourceLang}
            targetLang={targetLang}
            index={index}
            isActive={segment.id === activeSegmentId}
            onActivate={() => setActiveSegmentId(segment.id)}
          />
        ))}

        {filteredSegments.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Nenhum segmento corresponde ao filtro selecionado
            </CardContent>
          </Card>
        )}
      </div>

      <KeyboardShortcutsModal />
    </div>
  )
}
