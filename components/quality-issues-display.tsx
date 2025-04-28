"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, AlertTriangle, Code, Type, Ruler, Book, Hash } from "lucide-react"
import type { QualityIssue, QualityIssueType } from "@/utils/quality-checks"

interface QualityIssuesDisplayProps {
  issues: QualityIssue[]
}

export default function QualityIssuesDisplay({ issues }: QualityIssuesDisplayProps) {
  const [expanded, setExpanded] = useState(false)

  if (issues.length === 0) return null

  const errorCount = issues.filter((issue) => issue.severity === "error").length
  const warningCount = issues.filter((issue) => issue.severity === "warning").length

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

  return (
    <div className="mt-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        className={`w-full justify-between ${errorCount > 0 ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}
      >
        <div className="flex items-center">
          {errorCount > 0 ? (
            <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
          ) : (
            <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
          )}
          <span>
            {errorCount > 0 ? `${errorCount} ${errorCount === 1 ? "erro" : "erros"}` : ""}
            {errorCount > 0 && warningCount > 0 ? " e " : ""}
            {warningCount > 0 ? `${warningCount} ${warningCount === 1 ? "aviso" : "avisos"}` : ""}
          </span>
        </div>
        <span className="text-xs">{expanded ? "Ocultar detalhes" : "Mostrar detalhes"}</span>
      </Button>

      {expanded && (
        <Card className="mt-2 border-none shadow-none">
          <CardContent className="p-2 space-y-2">
            {issues.map((issue, index) => (
              <div
                key={`issue-${index}`}
                className={`p-2 rounded-md text-sm ${
                  issue.severity === "error" ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"
                }`}
              >
                <div className="flex items-start">
                  <div className={`mt-0.5 mr-2 ${issue.severity === "error" ? "text-red-500" : "text-amber-500"}`}>
                    {getIssueIcon(issue.type)}
                  </div>
                  <div>
                    <p>{issue.description}</p>
                    {issue.sourceText && (
                      <p className="mt-1 text-xs">
                        <span className="font-medium">Texto fonte:</span> {issue.sourceText}
                      </p>
                    )}
                    {issue.targetText && (
                      <p className="mt-1 text-xs">
                        <span className="font-medium">Texto alvo:</span> {issue.targetText}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
