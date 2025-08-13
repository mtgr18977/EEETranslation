"use client"

import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"

interface SegmentSuggestionProps {
  suggestion: string
  onApply: () => void
  onReject: () => void
}

export default function SegmentSuggestion({ suggestion, onApply, onReject }: SegmentSuggestionProps) {
  return (
    <div className="space-y-2">
      <div className="p-3 bg-emerald-50 rounded-md min-h-[60px] whitespace-pre-wrap border border-emerald-100">
        {suggestion}
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onReject}>
          <X className="h-4 w-4 mr-1" />
          Reject
          <kbd className="ml-1 text-xs">Esc</kbd>
        </Button>
        <Button size="sm" onClick={onApply}>
          <Check className="h-4 w-4 mr-1" />
          Apply
          <kbd className="ml-1 text-xs">Alt+Enter</kbd>
        </Button>
      </div>
    </div>
  )
}
