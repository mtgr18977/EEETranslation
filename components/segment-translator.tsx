"use client"

import type React from "react"

import { useState, useRef, useEffect, memo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { translateText } from "@/app/actions/translate"
import { Loader2, Wand2, Check, X, AlignLeft, Keyboard, AlertCircle, AlertTriangle } from "lucide-react"
import type { SegmentPair } from "@/utils/segmentation"
import AlignedText from "./aligned-text"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { runQualityChecks, type QualityIssue } from "@/utils/quality-checks"
import QualityIssuesDisplay from "./quality-issues-display"

interface SegmentTranslatorProps {
  segment: SegmentPair
  onUpdateSegment: (id: string, translation: string) => void
  sourceLang: string
  targetLang: string
  index: number
  isActive: boolean
  onActivate: () => void
}

// Usar memo para evitar renderizações desnecessárias
const SegmentTranslator = memo(
  function SegmentTranslator({
    segment,
    onUpdateSegment,
    sourceLang,
    targetLang,
    index,
    isActive,
    onActivate,
  }: SegmentTranslatorProps) {
    // Estado local
    const [isTranslating, setIsTranslating] = useState(false)
    const [suggestion, setSuggestion] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<"edit" | "align">("edit")
    const [localText, setLocalText] = useState(segment.target)
    const [qualityIssues, setQualityIssues] = useState<QualityIssue[]>([])

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
      }
    }

    function handleRejectSuggestion() {
      setSuggestion(null)
    }

    function handleToggleViewMode(value: string) {
      // Salvar mudanças antes de mudar de visualização
      if (localText !== segment.target) {
        onUpdateSegment(segment.id, localText)
      }

      setViewMode(value as "edit" | "align")
    }

    function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
      const newText = e.target.value
      setLocalText(newText)
    }

    function handleBlur() {
      if (localText !== segment.target) {
        onUpdateSegment(segment.id, localText)
      }
    }

    function handleActivate() {
      if (!isActive) {
        // Salvar mudanças antes de ativar
        if (localText !== segment.target) {
          onUpdateSegment(segment.id, localText)
        }
        onActivate()
      }
    }

    // Verificar problemas de qualidade
    const hasErrors = qualityIssues.some((issue) => issue.severity === "error")
    const hasWarnings = qualityIssues.some((issue) => issue.severity === "warning")

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
          hasErrors ? "border-red-300" : hasWarnings ? "border-amber-300" : ""
        }`}
        onClick={handleActivate}
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
              <QualityIndicator />
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
                  {isTranslating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Wand2 className="h-4 w-4 mr-1" />
                  )}
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
                  <div className="p-3 bg-red-100 rounded-md min-h-[60px] whitespace-pre-wrap">{segment.source}</div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Target</div>
                  {suggestion ? (
                    <div className="space-y-2">
                      <div className="p-3 bg-green-100 rounded-md min-h-[60px] whitespace-pre-wrap">{suggestion}</div>
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
                      className={`min-h-[60px] ${
                        hasErrors
                          ? "bg-red-50 border-red-300"
                          : hasWarnings
                            ? "bg-amber-50 border-amber-300"
                            : "bg-sky-100"
                      }`}
                      rows={Math.max(3, segment.source.split("\n").length)}
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
  },
  (prevProps, nextProps) => {
    // Otimização de renderização - só renderizar novamente se algo importante mudar
    return (
      prevProps.segment.id === nextProps.segment.id &&
      prevProps.segment.target === nextProps.segment.target &&
      prevProps.isActive === nextProps.isActive &&
      prevProps.index === nextProps.index
    )
  },
)

export default SegmentTranslator
