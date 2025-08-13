"use client"

import { useRef, useEffect, useState, useCallback, memo } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import type { SegmentPair } from "@/utils/segmentation"
import type { GlossaryTerm } from "@/utils/glossary"
import SegmentTranslator from "./segment-translator"
import type { ApiSettings } from "@/components/api-settings-modal"
import { useDebounce } from "@/hooks/use-debounce"

interface VirtualizedSegmentListProps {
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

// Componente memoizado para o item do segmento
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
    measureRef,
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
    measureRef: (el: HTMLElement | null) => void
  }) {
    return (
      <div ref={measureRef}>
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
      </div>
    )
  },
  (prevProps, nextProps) => {
    // Otimização de renderização - só renderizar novamente se algo importante mudar
    return (
      prevProps.segment.id === nextProps.segment.id &&
      prevProps.segment.target === nextProps.segment.target &&
      prevProps.isActive === nextProps.isActive &&
      prevProps.index === nextProps.index &&
      prevProps.isFailedSegment === nextProps.isFailedSegment &&
      prevProps.glossaryTerms === nextProps.glossaryTerms
    )
  },
)

export default function VirtualizedSegmentList({
  segments,
  onUpdateSegment,
  sourceLang,
  targetLang,
  activeSegmentId,
  setActiveSegmentId,
  glossaryTerms,
  failedSegments,
  apiSettings,
}: VirtualizedSegmentListProps) {
  // Filtrar apenas segmentos exibíveis (não quebras de linha)
  const displayableSegments = segments.filter((s) => !s.isLineBreak)

  // Referência para o elemento de contêiner
  const parentRef = useRef<HTMLDivElement>(null)

  // Estado para armazenar a altura de cada segmento
  const [segmentHeights, setSegmentHeights] = useState<Record<string, number>>({})

  // Debounce para atualização de alturas para evitar muitas renderizações
  const debouncedSegmentHeights = useDebounce(segmentHeights, 100)

  // Configurar o virtualizador com opções otimizadas
  const virtualizer = useVirtualizer({
    count: displayableSegments.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(
      (index) => {
        const segment = displayableSegments[index]
        return (
          segmentHeights[segment.id] ||
          // Estimar com base no comprimento do texto
          Math.max(200, 100 + Math.min(500, segment.source.length * 0.5))
        )
      },
      [displayableSegments, segmentHeights],
    ),
    overscan: 5, // Renderizar alguns itens extras acima e abaixo da viewport
    paddingStart: 8,
    paddingEnd: 8,
    scrollPaddingStart: 8,
    scrollPaddingEnd: 8,
    measureElement: (element) => {
      // Medir o elemento real para obter a altura exata
      return element.getBoundingClientRect().height
    },
  })

  // Atualizar a altura de um segmento específico
  const updateSegmentHeight = useCallback((id: string, height: number) => {
    setSegmentHeights((prev) => {
      if (prev[id] === height) return prev
      return { ...prev, [id]: height }
    })
  }, [])

  // Rolar para o segmento ativo quando ele mudar
  useEffect(() => {
    if (activeSegmentId) {
      const index = displayableSegments.findIndex((s) => s.id === activeSegmentId)
      if (index !== -1) {
        virtualizer.scrollToIndex(index, { align: "center", behavior: "smooth" })
      }
    }
  }, [activeSegmentId, displayableSegments, virtualizer])

  // Otimizar a renderização usando ResizeObserver
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement
        const segmentId = element.dataset.segmentId
        if (segmentId) {
          updateSegmentHeight(segmentId, entry.contentRect.height)
        }
      }
    })

    // Observar elementos quando eles são renderizados
    const elements = document.querySelectorAll("[data-segment-id]")
    elements.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
    }
  }, [updateSegmentHeight])

  return (
    <div
      ref={parentRef}
      className="overflow-auto"
      style={{
        height: "calc(100vh - 250px)",
        maxHeight: "calc(100vh - 250px)",
        position: "relative",
        willChange: "transform", // Otimização de desempenho
        contain: "strict", // Otimização de desempenho
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const segment = displayableSegments[virtualItem.index]
          return (
            <div
              key={segment.id}
              data-index={virtualItem.index}
              data-segment-id={segment.id}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
                willChange: "transform", // Otimização de desempenho
              }}
            >
              <MemoizedSegmentItem
                segment={segment}
                onUpdateSegment={onUpdateSegment}
                sourceLang={sourceLang}
                targetLang={targetLang}
                index={virtualItem.index}
                isActive={segment.id === activeSegmentId}
                onActivate={() => setActiveSegmentId(segment.id)}
                glossaryTerms={glossaryTerms}
                isFailedSegment={failedSegments.includes(segment.id)}
                apiSettings={apiSettings}
                measureRef={(el) => {
                  if (el) {
                    virtualItem.measureElement(el)
                  }
                }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
