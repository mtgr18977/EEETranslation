"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ExternalLink, Loader2, Upload, Download, Trash2 } from "lucide-react"
import { type GlossaryTerm, loadGlossaryFromCSV, parseCSVContent } from "@/utils/glossary"

interface GlossaryModalProps {
  isOpen: boolean
  onClose: () => void
  glossaryUrl?: string
}

export default function GlossaryModal({ isOpen, onClose, glossaryUrl }: GlossaryModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [glossaryItems, setGlossaryItems] = useState<GlossaryTerm[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const savedGlossary = localStorage.getItem("glossary-terms")
    if (savedGlossary) {
      try {
        setGlossaryItems(JSON.parse(savedGlossary))
      } catch (err) {
        console.error("Failed to load saved glossary:", err)
      }
    }
  }, [])

  useEffect(() => {
    if (glossaryItems.length > 0) {
      localStorage.setItem("glossary-terms", JSON.stringify(glossaryItems))
    }
  }, [glossaryItems])

  // Load glossary when modal opens
  useEffect(() => {
    if (isOpen && glossaryUrl) {
      setIsLoading(true)
      setError(null)

      loadGlossaryFromCSV(glossaryUrl)
        .then((terms) => {
          setGlossaryItems(terms)
          setIsLoading(false)
        })
        .catch((err) => {
          console.error("Failed to load glossary:", err)
          setError("Failed to load glossary. Please try again.")
          setIsLoading(false)
        })
    }
  }, [isOpen, glossaryUrl])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Por favor, selecione um arquivo CSV válido.")
      return
    }

    setIsLoading(true)
    setError(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string
        const terms = parseCSVContent(csvContent)
        setGlossaryItems(terms)
        setIsLoading(false)

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } catch (err) {
        console.error("Failed to parse CSV:", err)
        setError("Erro ao processar o arquivo CSV. Verifique o formato.")
        setIsLoading(false)
      }
    }

    reader.onerror = () => {
      setError("Erro ao ler o arquivo.")
      setIsLoading(false)
    }

    reader.readAsText(file)
  }

  const handleExportCSV = () => {
    if (glossaryItems.length === 0) return

    const csvContent = [
      "term,definition,relatedUrl,relatedName",
      ...glossaryItems.map(
        (item) => `"${item.term}","${item.definition}","${item.relatedUrl || ""}","${item.relatedName || ""}"`,
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "glossario.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleClearGlossary = () => {
    setGlossaryItems([])
    localStorage.removeItem("glossary-terms")
  }

  const filteredItems = glossaryItems.filter(
    (item) =>
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const renderGlossaryItems = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Carregando glossário...</span>
        </div>
      )
    }

    if (error) {
      return <div className="p-4 text-center text-red-500">{error}</div>
    }

    if (filteredItems.length === 0) {
      return <div className="p-4 text-center text-muted-foreground">Nenhum termo encontrado</div>
    }

    return filteredItems.map((item, index) => (
      <div key={`glossary-item-${index}`} className="grid grid-cols-2 p-2 border-t hover:bg-muted/50">
        <div className="font-medium">{item.term}</div>
        <div className="space-y-1">
          <div>{item.definition}</div>
          {item.relatedUrl && (
            <ExternalLink href={item.relatedUrl} className="text-xs text-blue-600 hover:underline">
              {item.relatedName || item.relatedUrl}
            </ExternalLink>
          )}
        </div>
      </div>
    ))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Glossário</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
            <Upload className="h-4 w-4 mr-2" />
            Importar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={glossaryItems.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearGlossary} disabled={glossaryItems.length === 0}>
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar termo..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="border rounded-md">
          <div className="grid grid-cols-2 font-medium p-2 bg-muted">
            <div>Termo</div>
            <div>Definição</div>
          </div>
          <div className="max-h-[400px] overflow-y-auto">{renderGlossaryItems()}</div>
        </div>

        <div className="text-sm text-muted-foreground">{glossaryItems.length} termo(s) no glossário</div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
