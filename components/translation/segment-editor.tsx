"use client"

import type React from "react"

import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2, Wand2, Copy } from "lucide-react"
import type { SegmentPair } from "@/utils/segmentation"

interface SegmentEditorProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onBlur: () => void
  isFailedSegment: boolean
  hasErrors: boolean
  hasWarnings: boolean
  segment: SegmentPair
  isTranslating: boolean
  onTranslate: () => void
  onCopySourceToTarget: () => void
  translationError: string | null
}

export default function SegmentEditor({
  textareaRef,
  value,
  onChange,
  onBlur,
  isFailedSegment,
  hasErrors,
  hasWarnings,
  segment,
  isTranslating,
  onTranslate,
  onCopySourceToTarget,
  translationError,
}: SegmentEditorProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopySourceToTarget}
          title="Copy source to target (Ctrl+Alt+C)"
          className="text-xs"
        >
          <Copy className="h-4 w-4 mr-1" />
          Copy Source
        </Button>
        <Button variant="ghost" size="sm" onClick={onTranslate} disabled={isTranslating || !segment.source.trim()}>
          {isTranslating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Wand2 className="h-4 w-4 mr-1" />}
          {isTranslating ? "Translating..." : "Suggest"}
        </Button>
      </div>

      <Textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder="Enter translation..."
        className={`min-h-[60px] ${
          isFailedSegment
            ? "bg-red-50 border-red-300"
            : hasErrors
              ? "bg-red-50 border-red-300"
              : hasWarnings
                ? "bg-amber-50 border-amber-300"
                : "bg-blue-50 border-blue-100"
        } transition-colors duration-300`}
        rows={Math.max(3, segment.source.split("\n").length)}
      />

      {translationError && (
        <div className="text-red-500 text-xs mt-1 flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          {translationError}
        </div>
      )}
    </div>
  )
}
