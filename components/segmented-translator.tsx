"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import SegmentTranslator from "./segment-translator"
import { createSegmentPairs, joinSegments, type SegmentPair, splitIntoSegments } from "@/utils/segmentation"
import { Loader2, Keyboard } from "lucide-react"
import { translateText } from "@/app/actions/translate"
import { Progress } from "@/components/ui/progress"
import AlignmentLegend from "./alignment-legend"
import { useKeyboardShortcuts } from "@/contexts/keyboard-shortcuts-context"
import KeyboardShortcutsModal from "./keyboard-shortcuts-modal"

interface SegmentedTranslatorProps {
  sourceText: string
  targetText: string
  onUpdateTargetText: (text: string) => void
  sourceLang: string
  targetLang: string
}

export default function SegmentedTranslator({
  sourceText,
  targetText,
  onUpdateTargetText,
  sourceLang,
  targetLang,
}: SegmentedTranslatorProps) {
  const [segmentType, setSegmentType] = useState<"sentence" | "paragraph">("sentence")
  const [segments, setSegments] = useState<SegmentPair[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isBatchTranslating, setIsBatchTranslating] = useState(false)
  const [translationProgress, setTranslationProgress] = useState(0)
  const {
    activeSegmentId,
    setActiveSegmentId,
    registerShortcutHandler,
    unregisterShortcutHandler,
    setShortcutsModalOpen,
  } = useKeyboardShortcuts()

  // Process text into segments when source text or segment type changes
  useEffect(() => {
    setIsProcessing(true)

    // Use setTimeout to avoid blocking the UI
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
  }, [sourceText, segmentType, targetText, activeSegmentId, setActiveSegmentId])

  // Update target text when segments change
  useEffect(() => {
    if (segments.length > 0) {
      const newTargetText = joinSegments(segments.map((s) => s.target).filter(Boolean))
      onUpdateTargetText(newTargetText)
    }
  }, [segments, onUpdateTargetText])

  // Memoize these functions to prevent them from changing on every render
  const handleNextSegment = useCallback(() => {
    if (!activeSegmentId || segments.length === 0) return

    const currentIndex = segments.findIndex((s) => s.id === activeSegmentId)
    if (currentIndex < segments.length - 1) {
      setActiveSegmentId(segments[currentIndex + 1].id)
    }
  }, [activeSegmentId, segments, setActiveSegmentId])

  const handlePrevSegment = useCallback(() => {
    if (!activeSegmentId || segments.length === 0) return

    const currentIndex = segments.findIndex((s) => s.id === activeSegmentId)
    if (currentIndex > 0) {
      setActiveSegmentId(segments[currentIndex - 1].id)
    }
  }, [activeSegmentId, segments, setActiveSegmentId])

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
  }, [activeSegmentId, segments, setActiveSegmentId])

  const handleSaveTranslation = useCallback(() => {
    // Simulate saving - in a real app this would call an API
    alert("Translation saved!")
  }, [])

  // Use a stable reference for the shortcut handlers
  const shortcutHandlers = useMemo(
    () => ({
      nextSegment: handleNextSegment,
      prevSegment: handlePrevSegment,
      nextUntranslated: handleNextUntranslated,
      saveTranslation: handleSaveTranslation,
    }),
    [handleNextSegment, handlePrevSegment, handleNextUntranslated, handleSaveTranslation],
  )

  // Register global keyboard shortcuts
  useEffect(() => {
    registerShortcutHandler("nextSegment", shortcutHandlers.nextSegment)
    registerShortcutHandler("prevSegment", shortcutHandlers.prevSegment)
    registerShortcutHandler("nextUntranslated", shortcutHandlers.nextUntranslated)
    registerShortcutHandler("saveTranslation", shortcutHandlers.saveTranslation)

    return () => {
      unregisterShortcutHandler("nextSegment")
      unregisterShortcutHandler("prevSegment")
      unregisterShortcutHandler("nextUntranslated")
      unregisterShortcutHandler("saveTranslation")
    }
  }, [registerShortcutHandler, unregisterShortcutHandler, shortcutHandlers])

  const handleUpdateSegment = useCallback((id: string, translation: string) => {
    setSegments((prev) =>
      prev.map((segment) =>
        segment.id === id ? { ...segment, target: translation, isTranslated: Boolean(translation) } : segment,
      ),
    )
  }, [])

  const handleTranslateAll = async () => {
    const untranslatedSegments = segments.filter((s) => !s.isTranslated && s.source.trim())
    if (untranslatedSegments.length === 0) return

    setIsBatchTranslating(true)
    setTranslationProgress(0)

    try {
      // Translate segments one by one to show progress
      for (let i = 0; i < untranslatedSegments.length; i++) {
        const segment = untranslatedSegments[i]
        const result = await translateText(segment.source, sourceLang, targetLang)

        if (result.success && result.translation) {
          handleUpdateSegment(segment.id, result.translation)
        }

        // Update progress
        setTranslationProgress(Math.round(((i + 1) / untranslatedSegments.length) * 100))
      }
    } catch (error) {
      console.error("Batch translation error:", error)
    } finally {
      setIsBatchTranslating(false)
    }
  }

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

  const renderSegments = () => {
    return segments.map((segment, index) => (
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
    ))
  }

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

      <div className="space-y-2">{renderSegments()}</div>

      <KeyboardShortcutsModal />
    </div>
  )
}
