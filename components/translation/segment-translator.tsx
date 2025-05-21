"use client"

import { memo } from "react"
import type { SegmentPair } from "@/utils/segmentation"
import type { GlossaryTerm } from "@/utils/glossary"
import { useSegment } from "@/hooks/use-segment"
import SegmentView from "./segment-view"

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
  apiSettings?: { libreApiUrl?: string }
}

// Componente principal que gerencia o estado e a lógica
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
    apiSettings,
  }: SegmentTranslatorProps) {
    // Usar o hook personalizado para gerenciar a lógica do segmento
    const {
      isTranslating,
      suggestion,
      viewMode,
      localText,
      qualityIssues,
      highlightedTerms,
      translationError,
      textareaRef,
      handleTranslate,
      handleApplySuggestion,
      handleRejectSuggestion,
      handleViewModeChange,
      handleTextChange,
      handleCopySourceToTarget,
    } = useSegment({
      segment,
      onUpdateSegment,
      sourceLang,
      targetLang,
      isActive,
      glossaryTerms,
      apiSettings,
    })

    return (
      <SegmentView
        segment={segment}
        onUpdateSegment={onUpdateSegment}
        sourceLang={sourceLang}
        targetLang={targetLang}
        index={index}
        isActive={isActive}
        onActivate={onActivate}
        glossaryTerms={glossaryTerms}
        isFailedSegment={isFailedSegment}
        apiSettings={apiSettings}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        localText={localText}
        onLocalTextChange={handleTextChange}
        qualityIssues={qualityIssues}
        highlightedTerms={highlightedTerms}
        suggestion={suggestion}
        isTranslating={isTranslating}
        translationError={translationError}
        onTranslate={handleTranslate}
        onApplySuggestion={handleApplySuggestion}
        onRejectSuggestion={handleRejectSuggestion}
        onCopySourceToTarget={handleCopySourceToTarget}
        textareaRef={textareaRef}
      />
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
      prevProps.isFailedSegment === nextProps.isFailedSegment &&
      prevProps.apiSettings === nextProps.apiSettings
    )
  },
)

export default SegmentTranslator
