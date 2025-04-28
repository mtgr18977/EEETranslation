"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { translateText } from "@/app/actions/translate"
import { Loader2, Wand2, Check, X, AlignLeft, Keyboard } from "lucide-react"
import type { SegmentPair } from "@/utils/segmentation"
import AlignedText from "./aligned-text"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SegmentTranslatorProps {
  segment: SegmentPair
  onUpdateSegment: (id: string, translation: string) => void
  sourceLang: string
  targetLang: string
  index: number
  isActive: boolean
  onActivate: () => void
  registerShortcuts?: (handlers: any) => void
  unregisterShortcuts?: () => void
}

export default function SegmentTranslator({
  segment,
  onUpdateSegment,
  sourceLang,
  targetLang,
  index,
  isActive,
  onActivate,
  registerShortcuts,
  unregisterShortcuts,
}: SegmentTranslatorProps) {
  // Simple state management
  const [isTranslating, setIsTranslating] = useState(false)
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"edit" | "align">("edit")
  const [localText, setLocalText] = useState(segment.target)

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const hasChangesRef = useRef(false)

  // Update local text when segment changes (but not during active editing)
  useEffect(() => {
    if (!isActive || !hasChangesRef.current) {
      setLocalText(segment.target)
    }
  }, [segment.target, isActive])

  // Save changes when component unmounts or becomes inactive
  useEffect(() => {
    return () => {
      if (hasChangesRef.current) {
        onUpdateSegment(segment.id, localText)
        hasChangesRef.current = false
      }
    }
  }, [])

  // Register keyboard shortcuts if active
  useEffect(() => {
    if (isActive && registerShortcuts) {
      const handlers = {
        suggestTranslation: handleTranslate,
        applySuggestion: handleApplySuggestion,
        rejectSuggestion: handleRejectSuggestion,
        toggleAlignView: handleToggleViewMode,
        focusTargetText: handleFocusTargetText,
      }

      registerShortcuts(handlers)

      // Focus the textarea when segment becomes active
      if (viewMode === "edit" && textareaRef.current) {
        textareaRef.current.focus()
      }

      // Scroll into view if needed
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect()
        const isVisible = rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)

        if (!isVisible) {
          cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
        }
      }

      return () => {
        if (unregisterShortcuts) {
          unregisterShortcuts()
        }

        // Save changes when segment becomes inactive
        if (hasChangesRef.current) {
          onUpdateSegment(segment.id, localText)
          hasChangesRef.current = false
        }
      }
    }
  }, [isActive, registerShortcuts, unregisterShortcuts, viewMode])

  // Simple handlers
  async function handleTranslate() {
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
  }

  function handleApplySuggestion() {
    if (suggestion) {
      setLocalText(suggestion)
      onUpdateSegment(segment.id, suggestion)
      setSuggestion(null)
      hasChangesRef.current = false
    }
  }

  function handleRejectSuggestion() {
    setSuggestion(null)
  }

  function handleToggleViewMode() {
    // Save changes before switching views
    if (hasChangesRef.current && viewMode === "edit") {
      onUpdateSegment(segment.id, localText)
      hasChangesRef.current = false
    }

    setViewMode((prev) => (prev === "edit" ? "align" : "edit"))
  }

  function handleFocusTargetText() {
    if (viewMode === "edit" && textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setLocalText(e.target.value)
    hasChangesRef.current = true
  }

  function handleBlur() {
    if (hasChangesRef.current) {
      onUpdateSegment(segment.id, localText)
      hasChangesRef.current = false
    }
  }

  return (
    <Card
      ref={cardRef}
      className={`mb-4 ${isActive ? "border-primary border-2" : ""}`}
      onClick={() => {
        if (!isActive) {
          // Save changes in current segment before activating new one
          if (hasChangesRef.current) {
            onUpdateSegment(segment.id, localText)
            hasChangesRef.current = false
          }
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
            <Tabs value={viewMode} onValueChange={handleToggleViewMode}>
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
                    ref={textareaRef}
                    value={localText}
                    onChange={handleTextChange}
                    onBlur={handleBlur}
                    placeholder="Enter translation..."
                    className="min-h-[60px] bg-sky-100"
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
