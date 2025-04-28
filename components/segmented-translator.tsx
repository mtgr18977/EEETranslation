"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import SegmentTranslator from "./segment-translator"
import { createSegmentPairs, joinSegments, type SegmentPair, splitIntoSegments } from "@/utils/segmentation"
import { Loader2 } from "lucide-react"
import { translateText } from "@/app/actions/translate"
import { Progress } from "@/components/ui/progress"

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

  // Process text into segments when source text or segment type changes
  useEffect(() => {
    setIsProcessing(true)

    // Use setTimeout to avoid blocking the UI
    setTimeout(() => {
      const sourceSegments = splitIntoSegments(sourceText, segmentType)
      const targetSegments = targetText ? splitIntoSegments(targetText, segmentType) : []

      setSegments(createSegmentPairs(sourceSegments, targetSegments))
      setIsProcessing(false)
    }, 0)
  }, [sourceText, segmentType, targetText])

  // Update target text when segments change
  useEffect(() => {
    if (segments.length > 0) {
      const newTargetText = joinSegments(segments.map((s) => s.target).filter(Boolean))
      onUpdateTargetText(newTargetText)
    }
  }, [segments, onUpdateTargetText])

  const handleUpdateSegment = (id: string, translation: string) => {
    setSegments((prev) =>
      prev.map((segment) =>
        segment.id === id ? { ...segment, target: translation, isTranslated: Boolean(translation) } : segment,
      ),
    )
  }

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

      <div className="space-y-2">
        {segments.map((segment, index) => (
          <SegmentTranslator
            key={segment.id}
            segment={segment}
            onUpdateSegment={handleUpdateSegment}
            sourceLang={sourceLang}
            targetLang={targetLang}
            index={index}
          />
        ))}
      </div>
    </div>
  )
}
