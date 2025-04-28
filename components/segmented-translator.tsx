"use client"

import { useMemo } from "react"

import { useState, useEffect, useCallback, useRef } from "react"
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
  // Basic state
  const [segmentType, setSegmentType] = useState<"sentence" | "paragraph">("sentence")
  const [segments, setSegments] = useState<SegmentPair[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isBatchTranslating, setIsBatchTranslating] = useState(false)
  const [translationProgress, setTranslationProgress] = useState(0)
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null)
  const [qualityFilter, setQualityFilter] = useState<QualityFilter>("all")

  // Use a ref for tracking if we need to update the target text
  const shouldUpdateTargetRef = useRef(false)
  const segmentsRef = useRef<SegmentPair[]>([])

  // Get keyboard shortcuts context
  const { registerShortcutHandler, unregisterShortcutHandler, setShortcutsModalOpen } = useKeyboardShortcuts()

  // Keep a reference to the current segments
  useEffect(() => {
    segmentsRef.current = segments
  }, [segments])

  // Process text into segments when source text or segment type changes
  useEffect(() => {
    setIsProcessing(true)

    const timeoutId = setTimeout(() => {
      const sourceSegments = splitIntoSegments(sourceText, segmentType)
      const targetSegments = targetText ? splitIntoSegments(targetText, segmentType) : []

      const newSegments = createSegmentPairs(sourceSegments, targetSegments)
      setSegments(newSegments)

      // Set the first segment as active if none is active and there are segments
      if (newSegments.length > 0 && !activeSegmentId) {
        setActiveSegmentId(newSegments[0].id)
      }

      setIsProcessing(false)
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [sourceText, segmentType, targetText])

  // Update target text when needed
  useEffect(() => {
    if (shouldUpdateTargetRef.current && segments.length > 0) {
      const timeoutId = setTimeout(() => {
        // Usar a função joinSegments melhorada para preservar quebras de linha
        const newTargetText = joinSegments(segments.map((s) => s.target))
        onUpdateTargetText(newTargetText)
        shouldUpdateTargetRef.current = false
      }, 500)

      return () => clearTimeout(timeoutId)
    }
  }, [segments, onUpdateTargetText])

  // Handle segment update
  const handleUpdateSegment = useCallback((id: string, translation: string) => {
    setSegments((prev) => {
      // Find the segment to update
      const segmentIndex = prev.findIndex((s) => s.id === id)
      if (segmentIndex === -1) return prev

      const segmentToUpdate = prev[segmentIndex]

      // If the translation hasn't changed, don't update
      if (segmentToUpdate.target === translation) return prev

      // Create a new array with the updated segment
      const newSegments = [...prev]
      newSegments[segmentIndex] = {
        ...segmentToUpdate,
        target: translation,
        isTranslated: Boolean(translation.trim()),
      }

      // Marcar para atualizar o texto alvo
      shouldUpdateTargetRef.current = true
      return newSegments
    })
  }, [])

  // Navigation handlers
  const handleNextSegment = useCallback(() => {
    if (!activeSegmentId || segments.length === 0) return

    const currentIndex = segments.findIndex((s) => s.id === activeSegmentId)
    if (currentIndex < segments.length - 1) {
      setActiveSegmentId(segments[currentIndex + 1].id)
    }
  }, [activeSegmentId, segments])

  const handlePrevSegment = useCallback(() => {
    if (!activeSegmentId || segments.length === 0) return

    const currentIndex = segments.findIndex((s) => s.id === activeSegmentId)
    if (currentIndex > 0) {
      setActiveSegmentId(segments[currentIndex - 1].id)
    }
  }, [activeSegmentId, segments])

  const handleNextUntranslated = useCallback(() => {
    if (segments.length === 0) return

    const currentIndex = activeSegmentId ? segments.findIndex((s) => s.id === activeSegmentId) : -1

    // Find the next untranslated segment
    for (let i = currentIndex + 1; i < segments.length; i++) {
      if (!segments[i].isTranslated) {
        setActiveSegmentId(segments[i].id)
        return
      }
    }

    // If not found after current position, start from beginning
    if (currentIndex > 0) {
      for (let i = 0; i < currentIndex; i++) {
        if (!segments[i].isTranslated) {
          setActiveSegmentId(segments[i].id)
          return
        }
      }
    }
  }, [activeSegmentId, segments])

  // Save translation handler
  const handleSaveTranslation = useCallback(() => {
    shouldUpdateTargetRef.current = true
    // Force an update to trigger the useEffect
    setSegments((prev) => [...prev])
    alert("Translation saved!")
  }, [])

  // Register global keyboard shortcuts
  useEffect(() => {
    // Register handlers
    registerShortcutHandler("nextSegment", handleNextSegment)
    registerShortcutHandler("prevSegment", handlePrevSegment)
    registerShortcutHandler("nextUntranslated", handleNextUntranslated)
    registerShortcutHandler("saveTranslation", handleSaveTranslation)

    // Cleanup function
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

  // Handle batch translation
  const handleTranslateAll = async () => {
    const untranslatedSegments = segments.filter((s) => !s.isTranslated && s.source.trim())
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
      shouldUpdateTargetRef.current = true
      // Force an update to trigger the useEffect
      setSegments((prev) => [...prev])
    }
  }

  // Filter segments based on quality
  const filteredSegments = useMemo(() => {
    if (qualityFilter === "all") return segments

    return segments.filter((segment) => {
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

  const untranslatedCount = segments.filter((s) => !s.isTranslated && s.source.trim()).length
  const totalSegments = segments.filter((s) => s.source.trim()).length
  const translatedPercent =
    totalSegments > 0 ? Math.round(((totalSegments - untranslatedCount) / totalSegments) * 100) : 0

  // Calculate quality statistics
  const qualityStats = {
    errorCount: 0,
    warningCount: 0,
    cleanCount: 0,
  }

  segments.forEach((segment) => {
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
            index={segments.findIndex((s) => s.id === segment.id)} // Use the original index
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
