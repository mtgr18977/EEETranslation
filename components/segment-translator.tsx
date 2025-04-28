"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { translateText } from "@/app/actions/translate"
import { Loader2, Wand2, Check, X, AlignLeft } from "lucide-react"
import type { SegmentPair } from "@/utils/segmentation"
import AlignedText from "./aligned-text"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SegmentTranslatorProps {
  segment: SegmentPair
  onUpdateSegment: (id: string, translation: string) => void
  sourceLang: string
  targetLang: string
  index: number
}

export default function SegmentTranslator({
  segment,
  onUpdateSegment,
  sourceLang,
  targetLang,
  index,
}: SegmentTranslatorProps) {
  const [isTranslating, setIsTranslating] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"edit" | "align">("edit")

  const handleTranslate = async () => {
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

  const handleApplySuggestion = () => {
    if (suggestion) {
      onUpdateSegment(segment.id, suggestion)
      setSuggestion(null)
    }
  }

  const handleRejectSuggestion = () => {
    setSuggestion(null)
  }

  return (
    <Card className={`mb-4 ${isFocused ? "ring-2 ring-primary" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-muted-foreground">Segment {index + 1}</div>
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
                      </Button>
                      <Button size="sm" onClick={handleApplySuggestion}>
                        <Check className="h-4 w-4 mr-1" />
                        Apply
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Textarea
                    value={segment.target}
                    onChange={(e) => onUpdateSegment(segment.id, e.target.value)}
                    placeholder="Enter translation..."
                    className="min-h-[60px] bg-sky-100"
                    onFocus={() => setIsFocused(true)}
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
