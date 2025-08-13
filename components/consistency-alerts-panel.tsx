"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, CheckCircle, X, Zap, Book, Target, RefreshCw, Eye, EyeOff } from "lucide-react"
import { validateGlossaryConsistency, type GlossaryTerm } from "@/utils/glossary"

interface ConsistencyAlert {
  id: string
  type: "glossary" | "terminology" | "style" | "formatting"
  severity: "high" | "medium" | "low"
  title: string
  description: string
  sourceText?: string
  expectedText?: string
  suggestion?: string
  segmentIndex?: number
  canAutoResolve: boolean
}

interface ConsistencyAlertsPanelProps {
  sourceText: string
  targetText: string
  glossaryTerms: GlossaryTerm[]
  segments?: Array<{ source: string; target: string; id: string }>
  onResolveAlert?: (alertId: string, suggestion?: string) => void
  onApplySuggestion?: (alertId: string, suggestion: string, segmentIndex?: number) => void
  className?: string
}

export default function ConsistencyAlertsPanel({
  sourceText,
  targetText,
  glossaryTerms,
  segments = [],
  onResolveAlert,
  onApplySuggestion,
  className = "",
}: ConsistencyAlertsPanelProps) {
  const [resolvedAlerts, setResolvedAlerts] = useState<Set<string>>(new Set())
  const [hiddenAlerts, setHiddenAlerts] = useState<Set<string>>(new Set())
  const [showResolved, setShowResolved] = useState(false)

  const alerts = useMemo(() => {
    const generatedAlerts: ConsistencyAlert[] = []

    // Check glossary consistency
    if (glossaryTerms.length > 0) {
      const glossaryValidation = validateGlossaryConsistency(sourceText, targetText, glossaryTerms)

      glossaryValidation.issues.forEach((issue, index) => {
        generatedAlerts.push({
          id: `glossary-${index}`,
          type: "glossary",
          severity: "high",
          title: "Inconsistência no Glossário",
          description: `O termo "${issue.sourceTerm}" deveria ser traduzido como "${issue.expectedTranslation}"`,
          sourceText: issue.sourceTerm,
          expectedText: issue.expectedTranslation,
          suggestion: `Substituir por "${issue.expectedTranslation}"`,
          canAutoResolve: true,
        })
      })

      // Check for segment-level glossary issues
      segments.forEach((segment, segmentIndex) => {
        const segmentValidation = validateGlossaryConsistency(segment.source, segment.target, glossaryTerms)

        segmentValidation.issues.forEach((issue, issueIndex) => {
          generatedAlerts.push({
            id: `segment-glossary-${segmentIndex}-${issueIndex}`,
            type: "glossary",
            severity: "high",
            title: `Glossário - Segmento ${segmentIndex + 1}`,
            description: `O termo "${issue.sourceTerm}" deveria ser traduzido como "${issue.expectedTranslation}"`,
            sourceText: issue.sourceTerm,
            expectedText: issue.expectedTranslation,
            suggestion: segment.target.replace(
              new RegExp(`\\b${issue.sourceTerm}\\b`, "gi"),
              issue.expectedTranslation,
            ),
            segmentIndex,
            canAutoResolve: true,
          })
        })
      })
    }

    // Check for terminology consistency across segments
    if (segments.length > 1) {
      const termTranslations = new Map<string, Set<string>>()

      segments.forEach((segment) => {
        const sourceWords = segment.source.toLowerCase().match(/\b\w{4,}\b/g) || []
        const targetWords = segment.target.toLowerCase().match(/\b\w{4,}\b/g) || []

        sourceWords.forEach((word) => {
          if (!termTranslations.has(word)) {
            termTranslations.set(word, new Set())
          }
          // Simple heuristic: if target contains a similar word, consider it a translation
          targetWords.forEach((targetWord) => {
            if (targetWord.length >= word.length * 0.7) {
              termTranslations.get(word)!.add(targetWord)
            }
          })
        })
      })

      // Find terms with multiple translations
      termTranslations.forEach((translations, term) => {
        if (translations.size > 1) {
          generatedAlerts.push({
            id: `terminology-${term}`,
            type: "terminology",
            severity: "medium",
            title: "Inconsistência Terminológica",
            description: `O termo "${term}" tem múltiplas traduções: ${Array.from(translations).join(", ")}`,
            sourceText: term,
            suggestion: `Padronizar tradução de "${term}"`,
            canAutoResolve: false,
          })
        }
      })
    }

    // Check for style consistency
    const sourceHasNumbers = /\d/.test(sourceText)
    const targetHasNumbers = /\d/.test(targetText)

    if (sourceHasNumbers && !targetHasNumbers) {
      generatedAlerts.push({
        id: "style-numbers",
        type: "style",
        severity: "medium",
        title: "Números Ausentes",
        description: "O texto original contém números que podem estar ausentes na tradução",
        suggestion: "Verificar se todos os números foram preservados",
        canAutoResolve: false,
      })
    }

    // Check for formatting consistency
    const sourceBold = (sourceText.match(/\*\*.*?\*\*/g) || []).length
    const targetBold = (targetText.match(/\*\*.*?\*\*/g) || []).length

    if (sourceBold !== targetBold) {
      generatedAlerts.push({
        id: "formatting-bold",
        type: "formatting",
        severity: "low",
        title: "Formatação Inconsistente",
        description: `Texto em negrito: original tem ${sourceBold}, tradução tem ${targetBold}`,
        suggestion: "Verificar formatação em negrito",
        canAutoResolve: false,
      })
    }

    return generatedAlerts
  }, [sourceText, targetText, glossaryTerms, segments])

  const activeAlerts = alerts.filter((alert) => !resolvedAlerts.has(alert.id) && !hiddenAlerts.has(alert.id))

  const resolvedAlertsList = alerts.filter((alert) => resolvedAlerts.has(alert.id))

  const handleResolveAlert = (alertId: string, suggestion?: string) => {
    setResolvedAlerts((prev) => new Set([...prev, alertId]))
    onResolveAlert?.(alertId, suggestion)
  }

  const handleHideAlert = (alertId: string) => {
    setHiddenAlerts((prev) => new Set([...prev, alertId]))
  }

  const handleApplySuggestion = (alert: ConsistencyAlert) => {
    if (alert.suggestion) {
      onApplySuggestion?.(alert.id, alert.suggestion, alert.segmentIndex)
      handleResolveAlert(alert.id, alert.suggestion)
    }
  }

  const getAlertIcon = (type: ConsistencyAlert["type"]) => {
    switch (type) {
      case "glossary":
        return <Book className="h-4 w-4" />
      case "terminology":
        return <Target className="h-4 w-4" />
      case "style":
        return <RefreshCw className="h-4 w-4" />
      case "formatting":
        return <Eye className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: ConsistencyAlert["severity"]) => {
    switch (severity) {
      case "high":
        return "text-red-600 border-red-200 bg-red-50"
      case "medium":
        return "text-amber-600 border-amber-200 bg-amber-50"
      case "low":
        return "text-blue-600 border-blue-200 bg-blue-50"
      default:
        return "text-gray-600 border-gray-200 bg-gray-50"
    }
  }

  const getSeverityBadge = (severity: ConsistencyAlert["severity"]) => {
    switch (severity) {
      case "high":
        return (
          <Badge variant="destructive" className="text-xs">
            Alta
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
            Média
          </Badge>
        )
      case "low":
        return (
          <Badge variant="outline" className="text-xs">
            Baixa
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs">
            -
          </Badge>
        )
    }
  }

  if (alerts.length === 0) {
    return (
      <Card className={`${className} border-green-200 bg-green-50`}>
        <CardContent className="p-4">
          <div className="flex items-center text-green-700">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">Nenhuma inconsistência encontrada</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
            <span>Alertas de Consistência</span>
          </div>
          <div className="flex items-center gap-2">
            {activeAlerts.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeAlerts.length} {activeAlerts.length === 1 ? "alerta" : "alertas"}
              </Badge>
            )}
            {resolvedAlertsList.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setShowResolved(!showResolved)} className="h-6 text-xs">
                {showResolved ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                {resolvedAlertsList.length} resolvidos
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="max-h-96">
          <div className="space-y-3">
            {/* Active Alerts */}
            {activeAlerts.map((alert) => (
              <Card key={alert.id} className={`border-l-4 ${getSeverityColor(alert.severity)}`}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2 flex-1">
                      <div
                        className={`mt-0.5 ${alert.severity === "high" ? "text-red-500" : alert.severity === "medium" ? "text-amber-500" : "text-blue-500"}`}
                      >
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                          {getSeverityBadge(alert.severity)}
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{alert.description}</p>

                        {alert.sourceText && (
                          <p className="text-xs text-gray-600 mb-1">
                            <span className="font-medium">Encontrado:</span> "{alert.sourceText}"
                          </p>
                        )}

                        {alert.expectedText && (
                          <p className="text-xs text-gray-600 mb-2">
                            <span className="font-medium">Esperado:</span> "{alert.expectedText}"
                          </p>
                        )}

                        {alert.segmentIndex !== undefined && (
                          <p className="text-xs text-blue-600 mb-2">
                            <span className="font-medium">Segmento:</span> {alert.segmentIndex + 1}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleHideAlert(alert.id)}
                        className="h-6 w-6 p-0"
                        title="Ocultar alerta"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {alert.suggestion && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-blue-600">
                          <Zap className="h-3 w-3 mr-1" />
                          <span className="font-medium">Sugestão:</span>
                          <span className="ml-1">{alert.suggestion}</span>
                        </div>
                        {alert.canAutoResolve && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApplySuggestion(alert)}
                            className="h-6 text-xs px-2"
                          >
                            Aplicar
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResolveAlert(alert.id)}
                      className="h-6 text-xs px-2 text-green-600 hover:text-green-700"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Marcar como resolvido
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Resolved Alerts */}
            {showResolved && resolvedAlertsList.length > 0 && (
              <>
                <Separator className="my-3" />
                <div className="text-sm font-medium text-gray-600 mb-2">Alertas Resolvidos</div>
                {resolvedAlertsList.map((alert) => (
                  <Card key={alert.id} className="border-green-200 bg-green-50 opacity-75">
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-800">{alert.title}</p>
                          <p className="text-xs text-green-600">{alert.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
