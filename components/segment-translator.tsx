"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { translateText } from "@/app/actions/translate"
import { Loader2, Wand2, Check, X, AlignLeft, Keyboard } from "lucide-react"
import type { SegmentPair } from "@/utils/segmentation"
import AlignedText from "./aligned-text"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useKeyboardShortcuts } from "@/contexts/keyboard-shortcuts-context"

interface SegmentTranslatorProps {
  segment: SegmentPair
  onUpdateSegment: (id: string, translation: string) => void
  sourceLang: string
  targetLang: string
  index: number
  isActive: boolean
  onActivate: () => void
}

export default function SegmentTranslator({
  segment,
  onUpdateSegment,
  sourceLang,
  targetLang,
  index,
  isActive,
  onActivate,
}: SegmentTranslatorProps) {
  const [isTranslating, setIsTranslating] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"edit" | "align">("edit")
  const targetTextareaRef = useRef<HTMLTextAreaElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const { registerShortcutHandler, unregisterShortcutHandler } = useKeyboardShortcuts()

  // Memoize handlers to prevent them from changing on every render
  const handleTranslate = useCallback(async () => {
    if (!segment.source.trim() || isTranslating) return

    setIsTranslating(true)
    try {
      const result = await translateText(segment.source, sourceLang, targetLang)

      if (result.success && result.translation) {
        setSuggestion(result.translation)
      }
    } catch (error) {
      console.error("Translation error:", error)
    } finally {
      setIsTranslating(false)
    }
  }, [segment.source, isTranslating, sourceLang, targetLang])

  const handleApplySuggestion = useCallback(() => {
    if (suggestion) {
      onUpdateSegment(segment.id, suggestion)
      setSuggestion(null)
    }
  }, [suggestion, onUpdateSegment, segment.id])

  const handleRejectSuggestion = useCallback(() => {
    setSuggestion(null)
  }, [])

  const handleToggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === "edit" ? "align" : "edit"))
  }, [])

  const handleFocusTargetText = useCallback(() => {
    if (viewMode === "edit" && targetTextareaRef.current) {
      targetTextareaRef.current.focus()
    }
  }, [viewMode])

  // Register keyboard shortcuts when this segment is active
  useEffect(() => {
    if (isActive) {
      // Register handlers for this segment
      registerShortcutHandler("suggestTranslation", handleTranslate)
      registerShortcutHandler("applySuggestion", handleApplySuggestion)
      registerShortcutHandler("rejectSuggestion", handleRejectSuggestion)
      registerShortcutHandler("toggleAlignView", handleToggleViewMode)
      registerShortcutHandler("focusTargetText", handleFocusTargetText)

      // Scroll into view if needed
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect()
        const isVisible = rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)

        if (!isVisible) {
          cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
        }
      }

      // Cleanup function
      return () => {
        unregisterShortcutHandler("suggestTranslation")
        unregisterShortcutHandler("applySuggestion")
        unregisterShortcutHandler("rejectSuggestion")
        unregisterShortcutHandler("toggleAlignView")
        unregisterShortcutHandler("focusTargetText")
      }
    }
    // No cleanup needed if not active
    return undefined
  }, [
    isActive,
    registerShortcutHandler,
    unregisterShortcutHandler,
    handleTranslate,
    handleApplySuggestion,
    handleRejectSuggestion,
    handleToggleViewMode,
    handleFocusTargetText,
  ])

  return (
    <Card
      ref={cardRef}
      className={`mb-4 ${isFocused ? "ring-2 ring-primary" : ""} ${isActive ? "border-primary border-2" : ""}`}
      onClick={onActivate}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.altKey && !e.ctrlKey && !e.shiftKey) {
          onActivate()
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-muted-foreground">Segment {index + 1}</div>
            {isActive && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Keyboard className="h-3 w-3 mr-1" />
                <span>Shortcuts active</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "edit" | "align")}>
              <TabsList className="h-8">
                <TabsTrigger value="edit" className="text-xs px-2 py-1">
                  Edit
                </TabsTrigger>
                <TabsTrigger value="align" className="text-xs px-2 py-1">
                  <AlignLeft className="h-3 w-3 mr-1" />
                  Align
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {!suggestion && viewMode === "edit" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTranslate}
                disabled={isTranslating || !segment.source.trim()}
              >
                {isTranslating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Wand2 className="h-4 w-4 mr-1" />}
                {isTranslating ? "Translating..." : "Suggest"}
              </Button>
            )}
          </div>
        </div>

        <Tabs value={viewMode} className="w-full">
          <TabsContent value="edit" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Source</div>
                <div className="p-3 bg-red-100 rounded-md min-h-[60px]">{segment.source}</div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Target</div>
                {suggestion ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-green-100 rounded-md min-h-[60px]">{suggestion}</div>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={handleRejectSuggestion}>
                        <X className="h-4 w-4 mr-1" />
                        Reject
                        <kbd className="ml-1 text-xs">Esc</kbd>
                      </Button>
                      <Button size="sm" onClick={handleApplySuggestion}>
                        <Check className="h-4 w-4 mr-1" />
                        Apply
                        <kbd className="ml-1 text-xs">Alt+Enter</kbd>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Textarea
                    ref={targetTextareaRef}
                    value={segment.target}
                    onChange={(e) => onUpdateSegment(segment.id, e.target.value)}
                    placeholder="Enter translation..."
                    className="min-h-[60px] bg-sky-100"
                    onFocus={() => {
                      setIsFocused(true)
                      onActivate()
                    }}
                    onBlur={() => setIsFocused(false)}
                  />
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="align" className="mt-0">
            <AlignedText sourceText={segment.source} targetText={segment.target} className="min-h-[60px]" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
