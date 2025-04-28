"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { runQualityChecks } from "@/utils/quality-checks"
import { splitIntoSegments } from "@/utils/segmentation"
import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react"
import { useMemo } from "react"
import ReadabilityReport from "./readability-report"

interface InfoPanelProps {
  sourceText: string
  targetText: string
  sourceLang?: string
  targetLang?: string
}

export default function InfoPanel({ sourceText, targetText, sourceLang = "en", targetLang = "pt" }: InfoPanelProps) {
  // Calculate statistics
  const sourceLines = sourceText ? sourceText.split("\n").length : 0
  const sourceChars = sourceText ? sourceText.length : 0
  const sourceWords = sourceText ? sourceText.split(/\s+/).filter(Boolean).length : 0

  const targetLines = targetText ? targetText.split("\n").length : 0
  const targetChars = targetText ? targetText.length : 0
  const targetWords = targetText ? targetText.split(/\s+/).filter(Boolean).length : 0

  const progress = sourceWords > 0 ? Math.round((targetWords / sourceWords) * 100) : 0

  // Calculate quality statistics
  const qualityStats = useMemo(() => {
    if (!sourceText || !targetText) return { errorCount: 0, warningCount: 0, cleanCount: 0, totalCount: 0 }

    const sourceSegments = splitIntoSegments(sourceText)
    const targetSegments = splitIntoSegments(targetText)

    let errorCount = 0
    let warningCount = 0
    let cleanCount = 0

    // Only check segments that have both source and target
    const count = Math.min(sourceSegments.length, targetSegments.length)

    for (let i = 0; i < count; i++) {
      if (!targetSegments[i].trim()) continue

      const issues = runQualityChecks(sourceSegments[i], targetSegments[i])

      if (issues.some((issue) => issue.severity === "error")) {
        errorCount++
      } else if (issues.some((issue) => issue.severity === "warning")) {
        warningCount++
      } else {
        cleanCount++
      }
    }

    return {
      errorCount,
      warningCount,
      cleanCount,
      totalCount: count,
    }
  }, [sourceText, targetText])

  // Language name mapping
  const languageNames: Record<string, string> = {
    en: "English",
    pt: "Portuguese",
    es: "Spanish",
    fr: "French",
    de: "German",
    it: "Italian",
    ja: "Japanese",
    zh: "Chinese",
    ru: "Russian",
    ar: "Arabic",
  }

  return (
    <Card className="w-64 bg-amber-100 overflow-auto">
      <CardHeader className="p-4 pb-0">
        <CardTitle>Info</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-medium">Texto original ({languageNames[sourceLang] || sourceLang})</h3>
            <div className="grid grid-cols-2 gap-1 text-sm">
              <div>Linhas:</div>
              <div className="text-right">{sourceLines}</div>
              <div>Palavras:</div>
              <div className="text-right">{sourceWords}</div>
              <div>Caracteres:</div>
              <div className="text-right">{sourceChars}</div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Texto traduzido ({languageNames[targetLang] || targetLang})</h3>
            <div className="grid grid-cols-2 gap-1 text-sm">
              <div>Linhas:</div>
              <div className="text-right">{targetLines}</div>
              <div>Palavras:</div>
              <div className="text-right">{targetWords}</div>
              <div>Caracteres:</div>
              <div className="text-right">{targetChars}</div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Progresso</h3>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="text-sm text-right">{progress}%</div>
          </div>

          {qualityStats.totalCount > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Qualidade</h3>
              <div className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                    <span>Sem problemas</span>
                  </div>
                  <div>{qualityStats.cleanCount}</div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
                    <span>Avisos</span>
                  </div>
                  <div>{qualityStats.warningCount}</div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1 text-red-500" />
                    <span>Erros</span>
                  </div>
                  <div>{qualityStats.errorCount}</div>
                </div>
              </div>

              <div className="flex h-2 mt-1">
                {qualityStats.totalCount > 0 && (
                  <>
                    {qualityStats.cleanCount > 0 && (
                      <div
                        className="bg-green-500 rounded-l-full"
                        style={{ width: `${(qualityStats.cleanCount / qualityStats.totalCount) * 100}%` }}
                      />
                    )}
                    {qualityStats.warningCount > 0 && (
                      <div
                        className={`bg-amber-500 ${qualityStats.cleanCount === 0 ? "rounded-l-full" : ""} ${qualityStats.errorCount === 0 ? "rounded-r-full" : ""}`}
                        style={{ width: `${(qualityStats.warningCount / qualityStats.totalCount) * 100}%` }}
                      />
                    )}
                    {qualityStats.errorCount > 0 && (
                      <div
                        className={`bg-red-500 ${qualityStats.cleanCount === 0 && qualityStats.warningCount === 0 ? "rounded-l-full" : ""} rounded-r-full`}
                        style={{ width: `${(qualityStats.errorCount / qualityStats.totalCount) * 100}%` }}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Relatório de Leiturabilidade */}
          {sourceText && <ReadabilityReport text={sourceText} lang={sourceLang} />}

          {targetText && <ReadabilityReport text={targetText} lang={targetLang} />}
        </div>
      </CardContent>
    </Card>
  )
}
