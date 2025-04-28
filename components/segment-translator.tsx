"use client"

import type React from "react"

import { useState, useRef, useEffect, memo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { translateText } from "@/app/actions/translate"
import { Loader2, Wand2, Check, X, AlignLeft, Keyboard, AlertCircle, AlertTriangle, Book } from "lucide-react"
import type { SegmentPair } from "@/utils/segmentation"
import AlignedText from "./aligned-text"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { runQualityChecks, type QualityIssue } from "@/utils/quality-checks"
import QualityIssuesDisplay from "./quality-issues-display"
import { type GlossaryTerm, findGlossaryTerms } from "@/utils/glossary"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import ExternalLink from "./external-link"

interface SegmentTranslatorProps {
  segment: SegmentPair
  onUpdateSegment: (id: string, translation: string) => void
  sourceLang: string
  targetLang: string
  index: number
  isActive: boolean
  onActivate: () => void
  glossaryTerms?: GlossaryTerm[]
  isFailedSegment?: boolean
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
    glossaryTerms = [],
    isFailedSegment = false,
  }: SegmentTranslatorProps) {
    // Estado local
    const [isTranslating, setIsTranslating] = useState(false)
    const [suggestion, setSuggestion] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<"edit" | "align">("edit")
    const [localText, setLocalText] = useState(segment.target)
    const [qualityIssues, setQualityIssues] = useState<QualityIssue[]>([])
    const [highlightedTerms, setHighlightedTerms] = useState<{ term: GlossaryTerm; index: number }[]>([])
    const [translationError, setTranslationError] = useState<string | null>(null)

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

    // Encontrar termos do glossário no texto fonte
    useEffect(() => {
      if (glossaryTerms.length > 0 && segment.source) {
        const terms = findGlossaryTerms(segment.source, glossaryTerms)
        setHighlightedTerms(terms)
      } else {
        setHighlightedTerms([])
      }
    }, [segment.source, glossaryTerms])

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
      setTranslationError(null)

      try {
        const result = await translateText(segment.source, sourceLang, targetLang)

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

    // Renderizar texto fonte com termos do glossário destacados
    const renderSourceText = () => {
      if (!segment.source || highlightedTerms.length === 0) {
        return <div className="p-3 bg-red-100 rounded-md min-h-[60px] whitespace-pre-wrap">{segment.source}</div>
      }

      const result = []
      let lastIndex = 0

      // Ordenar termos por índice para garantir a ordem correta
      const sortedTerms = [...highlightedTerms].sort((a, b) => a.index - b.index)

      for (const { term, index } of sortedTerms) {
        // Adicionar texto antes do termo
        if (index > lastIndex) {
          result.push(segment.source.substring(lastIndex, index))
        }

        // Adicionar o termo destacado
        const termText = segment.source.substring(index, index + term.term.length)
        result.push(
          <TooltipProvider key={`term-${index}`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="bg-yellow-200 px-0.5 rounded cursor-help">{termText}</span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">{term.term}</p>
                  <p className="text-xs">{term.definition}</p>
                  {term.relatedUrl && (
                    <a
                      href={term.relatedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center"
                    >
                      {term.relatedName || term.relatedUrl}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>,
        )

        lastIndex = index + term.term.length
      }

      // Adicionar texto restante
      if (lastIndex < segment.source.length) {
        result.push(segment.source.substring(lastIndex))
      }

      return <div className="p-3 bg-red-100 rounded-md min-h-[60px] whitespace-pre-wrap">{result}</div>
    }

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
                  {renderSourceText()}
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
                    <>
                      <Textarea
                        ref={textareaRef}
                        value={localText}
                        onChange={handleTextChange}
                        onBlur={handleBlur}
                        placeholder="Enter translation..."
                        className={`min-h-[60px] ${
                          isFailedSegment
                            ? "bg-red-50 border-red-300"
                            : hasErrors
                              ? "bg-red-50 border-red-300"
                              : hasWarnings
                                ? "bg-amber-50 border-amber-300"
                                : "bg-sky-100"
                        }`}
                        rows={Math.max(3, segment.source.split("\n").length)}
                      />

                      {translationError && (
                        <div className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {translationError}
                        </div>
                      )}
                    </>
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
      prevProps.index === nextProps.index &&
      prevProps.glossaryTerms === nextProps.glossaryTerms &&
      prevProps.isFailedSegment === nextProps.isFailedSegment
    )
  },
)

export default SegmentTranslator
