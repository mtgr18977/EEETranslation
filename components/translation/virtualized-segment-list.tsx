"use client"

import { useRef, useEffect, useState } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import type { SegmentPair } from "@/utils/segmentation"
import type { GlossaryTerm } from "@/utils/glossary"
import SegmentTranslator from "./segment-translator"
import type { ApiSettings } from "@/components/api-settings-modal"

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

  // Configurar o virtualizador
  const virtualizer = useVirtualizer({
    count: displayableSegments.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const segment = displayableSegments[index]
      return segmentHeights[segment.id] || 200 // Altura estimada padrão
    },
    overscan: 5, // Renderizar alguns itens extras acima e abaixo da viewport
  })

  // Atualizar a altura de um segmento específico
  const updateSegmentHeight = (id: string, height: number) => {
    setSegmentHeights((prev) => {
      if (prev[id] === height) return prev
      return { ...prev, [id]: height }
    })
  }

  // Rolar para o segmento ativo quando ele mudar
  useEffect(() => {
    if (activeSegmentId) {
      const index = displayableSegments.findIndex((s) => s.id === activeSegmentId)
      if (index !== -1) {
        virtualizer.scrollToIndex(index, { align: "center" })
      }
    }
  }, [activeSegmentId, displayableSegments, virtualizer])

  return (
    <div ref={parentRef} className="h-[calc(100vh-250px)] overflow-auto" style={{ contain: "strict" }}>
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
              ref={(el) => {
                if (el) {
                  // Atualizar a altura do segmento quando ele for renderizado
                  const height = el.getBoundingClientRect().height
                  updateSegmentHeight(segment.id, height)
                }
              }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <SegmentTranslator
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
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
