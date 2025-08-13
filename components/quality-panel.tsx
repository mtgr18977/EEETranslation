"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Hash,
  Code,
  Type,
  Ruler,
  Book,
  X,
  ChevronDown,
  ChevronRight,
  Zap,
} from "lucide-react"
import type { QualityIssue, QualityIssueType } from "@/utils/quality-checks"

interface QualityPanelProps {
  issues: QualityIssue[]
  onResolveIssue?: (issueIndex: number) => void
  onApplySuggestion?: (issueIndex: number, suggestion: string) => void
  className?: string
}

export default function QualityPanel({ issues, onResolveIssue, onApplySuggestion, className = "" }: QualityPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["errors"]))
  const [resolvedIssues, setResolvedIssues] = useState<Set<number>>(new Set())

  const categorizedIssues = issues.reduce(
    (acc, issue, index) => {
      const category = issue.severity === "error" ? "errors" : "warnings"
      if (!acc[category]) acc[category] = []
      acc[category].push({ ...issue, originalIndex: index })
      return acc
    },
    {} as Record<string, Array<QualityIssue & { originalIndex: number }>>,
  )

  const getIssueIcon = (type: QualityIssueType) => {
    switch (type) {
      case "missing-number":
      case "different-number":
        return <Hash className="h-4 w-4" />
      case "missing-tag":
      case "malformed-tag":
        return <Code className="h-4 w-4" />
      case "missing-punctuation":
        return <Type className="h-4 w-4" />
      case "length-ratio":
        return <Ruler className="h-4 w-4" />
      case "untranslated-term":
        return <Book className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const generateSuggestion = (issue: QualityIssue): string | null => {
    switch (issue.type) {
      case "missing-number":
        return issue.sourceText ? `Adicionar "${issue.sourceText}" à tradução` : null
      case "missing-punctuation":
        return "Adicionar pontuação correspondente"
      case "untranslated-term":
        return issue.sourceText ? `Manter "${issue.sourceText}" sem tradução` : null
      case "length-ratio":
        return "Revisar tradução para ajustar o comprimento"
      default:
        return null
    }
  }

  const handleResolveIssue = (issueIndex: number) => {
    setResolvedIssues((prev) => new Set([...prev, issueIndex]))
    onResolveIssue?.(issueIndex)
  }

  const handleApplySuggestion = (issueIndex: number, suggestion: string) => {
    setResolvedIssues((prev) => new Set([...prev, issueIndex]))
    onApplySuggestion?.(issueIndex, suggestion)
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  const activeIssues = issues.filter((_, index) => !resolvedIssues.has(index))
  const errorCount = activeIssues.filter((issue) => issue.severity === "error").length
  const warningCount = activeIssues.filter((issue) => issue.severity === "warning").length

  if (issues.length === 0) {
    return (
      <Card className={`${className} border-green-200 bg-green-50`}>
        <CardContent className="p-4">
          <div className="flex items-center text-green-700">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">Nenhum problema de qualidade encontrado</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`${className} ${errorCount > 0 ? "border-red-200" : "border-amber-200"}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center">
            {errorCount > 0 ? (
              <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
            )}
            <span>Verificações de Qualidade</span>
          </div>
          <div className="flex gap-2">
            {errorCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {errorCount} {errorCount === 1 ? "erro" : "erros"}
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                {warningCount} {warningCount === 1 ? "aviso" : "avisos"}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="max-h-96">
          <div className="space-y-3">
            {Object.entries(categorizedIssues).map(([category, categoryIssues]) => {
              const isExpanded = expandedCategories.has(category)
              const categoryTitle = category === "errors" ? "Erros" : "Avisos"
              const categoryColor = category === "errors" ? "text-red-600" : "text-amber-600"

              return (
                <div key={category}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCategory(category)}
                    className={`w-full justify-start p-2 h-auto ${categoryColor}`}
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                    <span className="font-medium">
                      {categoryTitle} ({categoryIssues.length})
                    </span>
                  </Button>

                  {isExpanded && (
                    <div className="ml-4 space-y-2 mt-2">
                      {categoryIssues.map((issue, index) => {
                        const isResolved = resolvedIssues.has(issue.originalIndex)
                        const suggestion = generateSuggestion(issue)

                        if (isResolved) return null

                        return (
                          <Card key={`${category}-${index}`} className="border-l-4 border-l-current">
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-2 flex-1">
                                  <div
                                    className={`mt-0.5 ${issue.severity === "error" ? "text-red-500" : "text-amber-500"}`}
                                  >
                                    {getIssueIcon(issue.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">{issue.description}</p>
                                    {issue.sourceText && (
                                      <p className="text-xs text-gray-600 mt-1">
                                        <span className="font-medium">Fonte:</span> {issue.sourceText}
                                      </p>
                                    )}
                                    {issue.targetText && (
                                      <p className="text-xs text-gray-600 mt-1">
                                        <span className="font-medium">Alvo:</span> {issue.targetText}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleResolveIssue(issue.originalIndex)}
                                  className="ml-2 h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>

                              {suggestion && (
                                <div className="mt-3 pt-2 border-t border-gray-100">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center text-xs text-blue-600">
                                      <Zap className="h-3 w-3 mr-1" />
                                      <span className="font-medium">Sugestão:</span>
                                      <span className="ml-1">{suggestion}</span>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleApplySuggestion(issue.originalIndex, suggestion)}
                                      className="h-6 text-xs px-2"
                                    >
                                      Aplicar
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}

                  {category !== Object.keys(categorizedIssues)[Object.keys(categorizedIssues).length - 1] && (
                    <Separator className="my-3" />
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
