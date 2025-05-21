"use client"

import type React from "react"

import { memo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlignLeft, Keyboard, AlertCircle, AlertTriangle, Book, Check } from "lucide-react"
import type { SegmentPair } from "@/utils/segmentation"
import type { GlossaryTerm } from "@/utils/glossary"
import type { QualityIssue } from "@/utils/quality-checks"
import AlignedText from "@/components/aligned-text" // Updated import path
import QualityIssuesDisplay from "../quality-issues-display" // Updated import path
import SegmentEditor from "./segment-editor"
import SegmentSource from "./segment-source"
import SegmentSuggestion from "./segment-suggestion"

interface SegmentViewProps {
  segment: SegmentPair
  onUpdateSegment: (id: string, translation: string) => void
  sourceLang: string
  targetLang: string
  index: number
  isActive: boolean
  onActivate: () => void
  glossaryTerms?: GlossaryTerm[]
  isFailedSegment?: boolean
  apiSettings?: { libreApiUrl?: string }
  viewMode: "edit" | "align"
  onViewModeChange: (mode: "edit" | "align") => void
  localText: string
  onLocalTextChange: (text: React.ChangeEvent<HTMLTextAreaElement>) => void
  qualityIssues: QualityIssue[]
  highlightedTerms: { term: GlossaryTerm; index: number }[]
  suggestion: string | null
  isTranslating: boolean
  translationError: string | null
  onTranslate: () => void
  onApplySuggestion: () => void
  onRejectSuggestion: () => void
  onCopySourceToTarget: () => void
  textareaRef: React.RefObject<HTMLTextAreaElement>
}

// Componente de visualização do segmento (sem lógica de negócio)
const SegmentView = memo(function SegmentView({
  segment,
  onUpdateSegment,
  index,
  isActive,
  onActivate,
  qualityIssues,
  highlightedTerms,
  isFailedSegment = false,
  viewMode,
  onViewModeChange,
  localText,
  onLocalTextChange,
  suggestion,
  isTranslating,
  translationError,
  onTranslate,
  onApplySuggestion,
  onRejectSuggestion,
  onCopySourceToTarget,
  textareaRef,
}: SegmentViewProps) {
  // Verificar problemas de qualidade
  const hasErrors = qualityIssues.some((issue) => issue.severity === "error")
  const hasWarnings = qualityIssues.some((issue) => issue.severity === "warning")
  const hasGlossaryTerms = highlightedTerms.length > 0

  // Indicador de qualidade
  const QualityIndicator = () => {
    if (!segment.target.trim()) return null

    if (hasErrors) {
      return (
        <div className="flex items-center text-red-500 text-xs">
          <AlertCircle className="h-3 w-3 mr-1" />
          <span>{qualityIssues.filter((i) => i.severity === "error").length} erros</span>
        </div>
      )
    }

    if (hasWarnings) {
      return (
        <div className="flex items-center text-amber-500 text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          <span>{qualityIssues.filter((i) => i.severity === "warning").length} avisos</span>
        </div>
      )
    }

    return (
      <div className="flex items-center text-green-500 text-xs">
        <Check className="h-3 w-3 mr-1" />
        <span>OK</span>
      </div>
    )
  }

  return (
    <Card
      className={`mb-4 ${isActive ? "border-primary border-2" : ""} ${
        isFailedSegment
          ? "border-red-500 border-2"
          : hasErrors
            ? "border-red-300"
            : hasWarnings
              ? "border-amber-300"
              : ""
      }`}
      onClick={onActivate}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium">Segment {index + 1}</div>
            {isActive && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Keyboard className="h-3 w-3 mr-1" />
                <span>Shortcuts active</span>
              </div>
            )}
            {isFailedSegment && (
              <div className="flex items-center text-red-500 text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                <span>Falha na tradução automática</span>
              </div>
            )}
            {hasGlossaryTerms && (
              <div className="flex items-center text-yellow-600 text-xs">
                <Book className="h-3 w-3 mr-1" />
                <span>
                  {highlightedTerms.length} {highlightedTerms.length === 1 ? "termo" : "termos"}
                </span>
              </div>
            )}
            <QualityIndicator />
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(value) => onViewModeChange(value as "edit" | "align")}>
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
          </div>
        </div>

        <Tabs value={viewMode} className="w-full">
          <TabsContent value="edit" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Source</div>
                <SegmentSource segment={segment} highlightedTerms={highlightedTerms} />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Target</div>
                {suggestion ? (
                  <SegmentSuggestion
                    suggestion={suggestion}
                    onApply={onApplySuggestion}
                    onReject={onRejectSuggestion}
                  />
                ) : (
                  <SegmentEditor
                    textareaRef={textareaRef}
                    value={localText}
                    onChange={onLocalTextChange}
                    onBlur={() => {
                      if (localText !== segment.target) {
                        onUpdateSegment(segment.id, localText)
                      }
                    }}
                    isFailedSegment={isFailedSegment}
                    hasErrors={hasErrors}
                    hasWarnings={hasWarnings}
                    segment={segment}
                    isTranslating={isTranslating}
                    onTranslate={onTranslate}
                    onCopySourceToTarget={onCopySourceToTarget}
                    translationError={translationError}
                  />
                )}
              </div>
            </div>

            {/* Display quality issues */}
            {qualityIssues.length > 0 && <QualityIssuesDisplay issues={qualityIssues} />}
          </TabsContent>

          <TabsContent value="align" className="mt-0">
            <AlignedText sourceText={segment.source} targetText={segment.target} className="min-h-[60px]" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
})

export default SegmentView
