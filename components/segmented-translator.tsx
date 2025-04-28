"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import SegmentTranslator from "./segment-translator"
import { createSegmentPairs, joinSegments, type SegmentPair, splitIntoSegments } from "@/utils/segmentation"
import { Loader2, Keyboard, Save, FileDown } from "lucide-react"
import { translateText } from "@/app/actions/translate"
import { Progress } from "@/components/ui/progress"
import AlignmentLegend from "./alignment-legend"
import { useKeyboardShortcuts } from "@/contexts/keyboard-shortcuts-context"
import KeyboardShortcutsModal from "./keyboard-shortcuts-modal"
import { runQualityChecks } from "@/utils/quality-checks"
import { calculateReadability } from "@/utils/readability"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SegmentedTranslatorProps {
  sourceText: string
  targetText: string
  onUpdateTargetText: (text: string) => void
  sourceLang: string
  targetLang: string
}

export default function SegmentedTranslator({
  sourceText,
  targetText,
  onUpdateTargetText,
  sourceLang,
  targetLang,
}: SegmentedTranslatorProps) {
  // Estado básico
  const [segments, setSegments] = useState<SegmentPair[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isBatchTranslating, setIsBatchTranslating] = useState(false)
  const [translationProgress, setTranslationProgress] = useState(0)
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null)
  const [showQualityReport, setShowQualityReport] = useState(false)
  const [qualityReportData, setQualityReportData] = useState<any>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Refs para controle de estado
  const sourceTextRef = useRef(sourceText)
  const targetTextRef = useRef(targetText)
  const segmentsRef = useRef<SegmentPair[]>([])

  // Obter contexto de atalhos de teclado
  const { registerShortcutHandler, unregisterShortcutHandler, setShortcutsModalOpen } = useKeyboardShortcuts()

  // Processar texto em segmentos quando o texto fonte muda
  useEffect(() => {
    // Pular se nada mudou
    if (sourceText === sourceTextRef.current && targetText === targetTextRef.current && segments.length > 0) {
      return
    }

    setIsProcessing(true)
    sourceTextRef.current = sourceText
    targetTextRef.current = targetText

    // Usar setTimeout para evitar bloqueio da UI
    const timeoutId = setTimeout(() => {
      try {
        const sourceSegments = splitIntoSegments(sourceText, "sentence")
        const targetSegments = targetText ? splitIntoSegments(targetText, "sentence") : []

        const newSegments = createSegmentPairs(sourceSegments, targetSegments)

        // Filtrar quebras de linha para exibição
        const displayableSegments = newSegments.filter((s) => !s.isLineBreak)

        setSegments(newSegments)
        segmentsRef.current = newSegments

        // Set the first segment as active if none is active and there are segments
        if (displayableSegments.length > 0 && !activeSegmentId) {
          setActiveSegmentId(displayableSegments[0].id)
        }
      } catch (error) {
        console.error("Error processing segments:", error)
      } finally {
        setIsProcessing(false)
      }
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [sourceText, targetText, activeSegmentId, segments.length])

  // Manipular atualização de segmento - apenas atualiza o estado local, não o texto alvo
  const handleUpdateSegment = useCallback((id: string, translation: string) => {
    setSegments((prev) => {
      // Encontrar o segmento a ser atualizado
      const segmentIndex = prev.findIndex((s) => s.id === id)
      if (segmentIndex === -1) return prev

      const segmentToUpdate = prev[segmentIndex]

      // Pular quebras de linha
      if (segmentToUpdate.isLineBreak) return prev

      // Se a tradução não mudou, não atualizar
      if (segmentToUpdate.target === translation) return prev

      // Criar novo array com o segmento atualizado
      const newSegments = [...prev]
      newSegments[segmentIndex] = {
        ...segmentToUpdate,
        target: translation,
        isTranslated: Boolean(translation.trim()),
      }

      // Atualizar a referência
      segmentsRef.current = newSegments

      return newSegments
    })
  }, [])

  // Manipuladores de navegação
  const handleNextSegment = useCallback(() => {
    if (!activeSegmentId || segments.length === 0) return

    // Encontrar segmentos exibíveis (não quebras de linha)
    const displayableSegments = segments.filter((s) => !s.isLineBreak)

    const currentIndex = displayableSegments.findIndex((s) => s.id === activeSegmentId)
    if (currentIndex < displayableSegments.length - 1) {
      const nextSegment = displayableSegments[currentIndex + 1]
      setActiveSegmentId(nextSegment.id)
    }
  }, [activeSegmentId, segments])

  const handlePrevSegment = useCallback(() => {
    if (!activeSegmentId || segments.length === 0) return

    // Encontrar segmentos exibíveis (não quebras de linha)
    const displayableSegments = segments.filter((s) => !s.isLineBreak)

    const currentIndex = displayableSegments.findIndex((s) => s.id === activeSegmentId)
    if (currentIndex > 0) {
      const prevSegment = displayableSegments[currentIndex - 1]
      setActiveSegmentId(prevSegment.id)
    }
  }, [activeSegmentId, segments])

  const handleNextUntranslated = useCallback(() => {
    if (segments.length === 0) return

    // Encontrar segmentos exibíveis (não quebras de linha)
    const displayableSegments = segments.filter((s) => !s.isLineBreak)

    const currentIndex = activeSegmentId ? displayableSegments.findIndex((s) => s.id === activeSegmentId) : -1

    // Encontrar o próximo segmento não traduzido
    for (let i = currentIndex + 1; i < displayableSegments.length; i++) {
      if (!displayableSegments[i].isTranslated) {
        setActiveSegmentId(displayableSegments[i].id)
        return
      }
    }

    // Se não encontrado após a posição atual, começar do início
    if (currentIndex > 0) {
      for (let i = 0; i < currentIndex; i++) {
        if (!displayableSegments[i].isTranslated) {
          setActiveSegmentId(displayableSegments[i].id)
          return
        }
      }
    }
  }, [activeSegmentId, segments])

  // Registrar atalhos de teclado globais
  useEffect(() => {
    // Registrar manipuladores
    registerShortcutHandler("nextSegment", handleNextSegment)
    registerShortcutHandler("prevSegment", handlePrevSegment)
    registerShortcutHandler("nextUntranslated", handleNextUntranslated)

    // Função de limpeza
    return () => {
      unregisterShortcutHandler("nextSegment")
      unregisterShortcutHandler("prevSegment")
      unregisterShortcutHandler("nextUntranslated")
    }
  }, [registerShortcutHandler, unregisterShortcutHandler, handleNextSegment, handlePrevSegment, handleNextUntranslated])

  // Manipular tradução em lote
  const handleTranslateAll = async () => {
    const untranslatedSegments = segments.filter((s) => !s.isTranslated && s.source.trim() && !s.isLineBreak)
    if (untranslatedSegments.length === 0) return

    setIsBatchTranslating(true)
    setTranslationProgress(0)

    try {
      for (let i = 0; i < untranslatedSegments.length; i++) {
        const segment = untranslatedSegments[i]

        const result = await translateText(segment.source, sourceLang, targetLang)

        if (result.success && result.translation) {
          handleUpdateSegment(segment.id, result.translation)
        }

        setTranslationProgress(Math.round(((i + 1) / untranslatedSegments.length) * 100))
      }
    } catch (error) {
      console.error("Batch translation error:", error)
    } finally {
      setIsBatchTranslating(false)
    }
  }

  // Função para salvar a tradução e gerar relatório
  const handleSaveTranslation = useCallback(() => {
    try {
      // Extrair texto alvo dos segmentos
      const targetSegments = segmentsRef.current.map((s) => s.target)
      const newTargetText = joinSegments(targetSegments)

      // Atualizar o texto alvo
      onUpdateTargetText(newTargetText)

      // Gerar relatório de qualidade
      const displayableSegments = segmentsRef.current.filter((s) => !s.isLineBreak)

      const qualityIssues = displayableSegments.map((segment) => {
        if (!segment.target.trim()) return { segment: segment.source, issues: [] }
        return {
          segment: segment.source,
          issues: runQualityChecks(segment.source, segment.target),
        }
      })

      // Calcular estatísticas de leiturabilidade
      const sourceReadability = calculateReadability(sourceText, sourceLang)
      const targetReadability = calculateReadability(newTargetText, targetLang)

      // Preparar dados do relatório
      const reportData = {
        qualityIssues,
        sourceReadability,
        targetReadability,
        stats: {
          totalSegments: displayableSegments.length,
          translatedSegments: displayableSegments.filter((s) => s.isTranslated).length,
          errorCount: qualityIssues.reduce(
            (count, item) => count + item.issues.filter((i) => i.severity === "error").length,
            0,
          ),
          warningCount: qualityIssues.reduce(
            (count, item) => count + item.issues.filter((i) => i.severity === "warning").length,
            0,
          ),
        },
      }

      setQualityReportData(reportData)
      setShowQualityReport(true)
      setSaveSuccess(true)

      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSaveSuccess(false)
      }, 3000)
    } catch (error) {
      console.error("Error saving translation:", error)
    }
  }, [onUpdateTargetText, sourceText, sourceLang, targetLang])

  // Função para exportar o relatório em Markdown
  const handleExportReport = useCallback(() => {
    if (!qualityReportData) return

    try {
      const { qualityIssues, sourceReadability, targetReadability, stats } = qualityReportData

      let markdown = `# Relatório de Qualidade da Tradução\n\n`

      // Estatísticas gerais
      markdown += `## Estatísticas Gerais\n\n`
      markdown += `- **Total de segmentos:** ${stats.totalSegments}\n`
      markdown += `- **Segmentos traduzidos:** ${stats.translatedSegments} (${Math.round((stats.translatedSegments / stats.totalSegments) * 100)}%)\n`
      markdown += `- **Erros encontrados:** ${stats.errorCount}\n`
      markdown += `- **Avisos encontrados:** ${stats.warningCount}\n\n`

      // Leiturabilidade
      markdown += `## Leiturabilidade\n\n`
      markdown += `### Texto Original (${sourceLang})\n\n`
      markdown += `- **Índice Flesch:** ${Math.round(sourceReadability.flesch.score)} (${sourceReadability.flesch.grade})\n`
      markdown += `- **Flesch-Kincaid:** ${sourceReadability.fleschKincaid.score.toFixed(1)} (${sourceReadability.fleschKincaid.grade})\n`
      markdown += `- **Coleman-Liau:** ${sourceReadability.colemanLiau.score.toFixed(1)} (${sourceReadability.colemanLiau.grade})\n`
      markdown += `- **Gunning Fog:** ${sourceReadability.gunningFog.score.toFixed(1)} (${sourceReadability.gunningFog.grade})\n`
      markdown += `- **SMOG:** ${sourceReadability.smog.score.toFixed(1)} (${sourceReadability.smog.grade})\n\n`

      markdown += `### Texto Traduzido (${targetLang})\n\n`
      markdown += `- **Índice Flesch:** ${Math.round(targetReadability.flesch.score)} (${targetReadability.flesch.grade})\n`
      markdown += `- **Flesch-Kincaid:** ${targetReadability.fleschKincaid.score.toFixed(1)} (${targetReadability.fleschKincaid.grade})\n`
      markdown += `- **Coleman-Liau:** ${targetReadability.colemanLiau.score.toFixed(1)} (${targetReadability.colemanLiau.grade})\n`
      markdown += `- **Gunning Fog:** ${targetReadability.gunningFog.score.toFixed(1)} (${targetReadability.gunningFog.grade})\n`
      markdown += `- **SMOG:** ${targetReadability.smog.score.toFixed(1)} (${targetReadability.smog.grade})\n\n`

      // Problemas de qualidade
      markdown += `## Problemas de Qualidade\n\n`

      const segmentsWithIssues = qualityIssues.filter((item) => item.issues.length > 0)

      if (segmentsWithIssues.length === 0) {
        markdown += `Nenhum problema de qualidade encontrado.\n\n`
      } else {
        segmentsWithIssues.forEach((item, index) => {
          markdown += `### Segmento ${index + 1}\n\n`
          markdown += `**Texto original:** ${item.segment}\n\n`

          item.issues.forEach((issue, i) => {
            const severity = issue.severity === "error" ? "❌ ERRO" : "⚠️ AVISO"
            markdown += `${i + 1}. **${severity}:** ${issue.description}\n`
            if (issue.sourceText) markdown += `   - Texto fonte: ${issue.sourceText}\n`
            if (issue.targetText) markdown += `   - Texto alvo: ${issue.targetText}\n`
          })

          markdown += `\n`
        })
      }

      // Criar e baixar o arquivo
      const blob = new Blob([markdown], { type: "text/markdown" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "relatorio-qualidade-traducao.md"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting report:", error)
    }
  }, [qualityReportData, sourceLang, targetLang])

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

  // Contar apenas segmentos reais (não quebras de linha)
  const displayableSegments = segments.filter((s) => !s.isLineBreak)
  const untranslatedCount = displayableSegments.filter((s) => !s.isTranslated && s.source.trim()).length
  const totalSegments = displayableSegments.filter((s) => s.source.trim()).length
  const translatedPercent =
    totalSegments > 0 ? Math.round(((totalSegments - untranslatedCount) / totalSegments) * 100) : 0

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
        <div className="space-y-1">
          <Progress value={translationProgress} className="h-2" />
          <div className="text-xs text-right text-muted-foreground">{translationProgress}%</div>
        </div>
      )}

      {saveSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">Tradução salva com sucesso!</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        {displayableSegments.map((segment, index) => (
          <SegmentTranslator
            key={segment.id}
            segment={segment}
            onUpdateSegment={handleUpdateSegment}
            sourceLang={sourceLang}
            targetLang={targetLang}
            index={index}
            isActive={segment.id === activeSegmentId}
            onActivate={() => setActiveSegmentId(segment.id)}
          />
        ))}
      </div>

      <div className="flex justify-center gap-4 pt-6 pb-2">
        <Button size="lg" onClick={handleSaveTranslation} className="bg-green-600 hover:bg-green-700">
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

      <KeyboardShortcutsModal />
    </div>
  )
}
