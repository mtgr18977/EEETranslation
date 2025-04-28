"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"

interface TMSegment {
  source: string
  target: string
  similarity: number
}

interface TranslationMemoryModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (segments: TMSegment[]) => void
}

export function TranslationMemoryModal({ isOpen, onClose, onApply }: TranslationMemoryModalProps) {
  const [tmFile, setTmFile] = useState<File | null>(null)
  const [segments, setSegments] = useState<TMSegment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setTmFile(file)
    setIsLoading(true)

    // Simulate loading TM file
    setTimeout(() => {
      // Mock data - in a real app, this would parse the actual TM file
      const mockSegments: TMSegment[] = [
        { source: "Hello world", target: "Olá mundo", similarity: 100 },
        { source: "Welcome to our platform", target: "Bem-vindo à nossa plataforma", similarity: 85 },
        { source: "Please upload your file", target: "Por favor, faça upload do seu arquivo", similarity: 75 },
      ]

      setSegments(mockSegments)
      setIsLoading(false)
    }, 1000)
  }

  const renderSegments = () => {
    return segments.map((segment, index) => (
      <div key={`tm-segment-${index}`} className="grid grid-cols-12 p-2 border-t hover:bg-muted/50">
        <div className="col-span-5">{segment.source}</div>
        <div className="col-span-5">{segment.target}</div>
        <div className="col-span-2 text-right">{segment.similarity}%</div>
      </div>
    ))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Memória de Tradução (MT)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input type="file" accept=".tmx,.xml" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Carregar arquivo MT
            </Button>

            {tmFile && <span className="text-sm text-muted-foreground">Arquivo: {tmFile.name}</span>}
          </div>

          {isLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : segments.length > 0 ? (
            <div className="border rounded-md">
              <div className="grid grid-cols-12 font-medium p-2 bg-muted">
                <div className="col-span-5">Texto Original</div>
                <div className="col-span-5">Tradução</div>
                <div className="col-span-2 text-right">Similaridade</div>
              </div>
              <div className="max-h-[300px] overflow-y-auto">{renderSegments()}</div>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Carregue um arquivo de memória de tradução para ver os segmentos
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              disabled={segments.length === 0}
              onClick={() => {
                onApply(segments)
                onClose()
              }}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
