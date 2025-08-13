"use client"

import { memo } from "react"
import type { SegmentPair } from "@/utils/segmentation"
import type { GlossaryTerm } from "@/utils/glossary"
import SegmentTranslator from "./segment-translator"
import type { ApiSettings } from "@/components/api-settings-modal"

interface OptimizedSegmentListProps {
  segments: SegmentPair[]
  onUpdateSegment: (id: string, translation: string) => void
  sourceLang: string
  targetLang: string
  activeSegmentId: string | null
  setActiveSegmentId: (id: string) => void
  glossaryTerms: GlossaryTerm[]
  failedSegments: string[]
  apiSettings?: ApiSettings
}

// Componente de item de lista memoizado para evitar renderizações desnecessárias
const MemoizedSegmentItem = memo(
  function SegmentItem({
    segment,
    onUpdateSegment,
    sourceLang,
    targetLang,
    index,
    isActive,
    onActivate,
    glossaryTerms,
    isFailedSegment,
    apiSettings,
  }: {
    segment: SegmentPair
    onUpdateSegment: (id: string, translation: string) => void
    sourceLang: string
    targetLang: string
    index: number
    isActive: boolean
    onActivate: () => void
    glossaryTerms: GlossaryTerm[]
    isFailedSegment: boolean
    apiSettings?: ApiSettings
  }) {
    return (
      <SegmentTranslator
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
      prevProps.isFailedSegment === nextProps.isFailedSegment
    )
  },
)

export default function OptimizedSegmentList({
  segments,
  onUpdateSegment,
  sourceLang,
  targetLang,
  activeSegmentId,
  setActiveSegmentId,
  glossaryTerms,
  failedSegments,
  apiSettings,
}: OptimizedSegmentListProps) {
  // Filtrar apenas segmentos exibíveis (não quebras de linha)
  const displayableSegments = segments.filter((s) => !s.isLineBreak)

  return (
    <div className="space-y-2 overflow-auto" style={{ maxHeight: "calc(100vh - 250px)" }}>
      {displayableSegments.map((segment, index) => (
        <MemoizedSegmentItem
          key={segment.id}
          segment={segment}
          onUpdateSegment={onUpdateSegment}
          sourceLang={sourceLang}
          targetLang={targetLang}
          index={index}
          isActive={segment.id === activeSegmentId}
          onActivate={() => setActiveSegmentId(segment.id)}
          glossaryTerms={glossaryTerms}
          isFailedSegment={failedSegments.includes(segment.id)}
          apiSettings={apiSettings}
        />
      ))}
    </div>
  )
}
