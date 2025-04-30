"use client"

import { lazy, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Keyboard, Save, FileDown, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import AlignmentLegend from "../alignment-legend"
import { useKeyboardShortcuts } from "@/contexts/keyboard-shortcuts-context"
import { useSegmentedTranslator } from "@/hooks/use-segmented-translator"
import type { GlossaryTerm } from "@/utils/glossary"
import type { ApiSettings } from "@/components/api-settings-modal"
import OptimizedSegmentList from "./optimized-segment-list"

// Lazy load o modal de atalhos de teclado
const KeyboardShortcutsModal = lazy(() => import("../keyboard-shortcuts-modal"))

interface SegmentedTranslatorProps {
  sourceText: string
  targetText: string
  onUpdateTargetText: (text: string) => void
  sourceLang: string
  targetLang: string
  glossaryTerms?: GlossaryTerm[]
  apiSettings?: ApiSettings
}

export default function SegmentedTranslator({
  sourceText,
  targetText,
  onUpdateTargetText,
  sourceLang,
  targetLang,
  glossaryTerms = [],
  apiSettings,
}: SegmentedTranslatorProps) {
  const { setShortcutsModalOpen } = useKeyboardShortcuts()

  const {
    segments,
    isProcessing,
    isBatchTranslating,
    translationProgress,
    activeSegmentId,
    showQualityReport,
    saveSuccess,
    translationError,
    failedSegments,
    translationDetails,
    untranslatedCount,
    totalSegments,
    translatedPercent,
    handleUpdateSegment,
    handleSaveTranslation,
    handleTranslateAll,
    handleExportReport,
    setActiveSegmentId,
  } = useSegmentedTranslator({
    sourceText,
    targetText,
    onUpdateTargetText,
    sourceLang,
    targetLang,
    apiSettings,
  })

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Processing segments...</span>
      </div>
    )
  }

  if (!sourceText.trim()) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Enter or upload source text to begin translation
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlignmentLegend />

          <Button variant="outline" size="sm" className="h-8" onClick={() => setShortcutsModalOpen(true)}>
            <Keyboard className="h-4 w-4 mr-1" />
            Shortcuts
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm">
            {totalSegments - untranslatedCount}/{totalSegments} segments translated ({translatedPercent}%)
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTranslateAll}
            disabled={untranslatedCount === 0 || isBatchTranslating}
          >
            {isBatchTranslating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                Translating...
              </>
            ) : (
              `Translate All (${untranslatedCount})`
            )}
          </Button>
        </div>
      </div>

      {isBatchTranslating && (
        <div className="text-sm text-right text-muted-foreground">Progresso: {translationProgress}%</div>
      )}

      {translationError && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
          <AlertDescription className="text-amber-800">
            {translationError}
            {translationDetails && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium">Detalhes técnicos</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">{translationDetails}</pre>
              </details>
            )}
          </AlertDescription>
        </Alert>
      )}

      {saveSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">Tradução salva com sucesso!</AlertDescription>
        </Alert>
      )}

      {/* Lista de segmentos otimizada */}
      <OptimizedSegmentList
        segments={segments}
        onUpdateSegment={handleUpdateSegment}
        sourceLang={sourceLang}
        targetLang={targetLang}
        activeSegmentId={activeSegmentId}
        setActiveSegmentId={setActiveSegmentId}
        glossaryTerms={glossaryTerms}
        failedSegments={failedSegments}
        apiSettings={apiSettings}
      />

      <div className="flex justify-center gap-4 pt-6 pb-2">
        <Button size="lg" onClick={handleSaveTranslation} className="bg-zinc-700 hover:bg-zinc-800 text-white">
          <Save className="h-5 w-5 mr-2" />
          Pronto
        </Button>

        {showQualityReport && (
          <Button size="lg" variant="outline" onClick={handleExportReport}>
            <FileDown className="h-5 w-5 mr-2" />
            Exportar Relatório
          </Button>
        )}
      </div>

      <Suspense fallback={null}>
        <KeyboardShortcutsModal />
      </Suspense>
    </div>
  )
}
