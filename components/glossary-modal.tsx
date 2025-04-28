"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ExternalLink, Loader2 } from "lucide-react"
import { type GlossaryTerm, loadGlossaryFromCSV } from "@/utils/glossary"

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
          <span>Loading glossary...</span>
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
            <a
              href={item.relatedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline flex items-center"
            >
              {item.relatedName || item.relatedUrl}
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
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

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
