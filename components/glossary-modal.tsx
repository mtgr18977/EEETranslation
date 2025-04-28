"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

interface GlossaryItem {
  term: string
  definition: string
}

interface GlossaryModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function GlossaryModal({ isOpen, onClose }: GlossaryModalProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // Mock glossary data - in a real app, this would come from a database
  const glossaryItems: GlossaryItem[] = [
    { term: "API", definition: "Interface de Programação de Aplicações" },
    { term: "UI", definition: "Interface do Usuário" },
    { term: "UX", definition: "Experiência do Usuário" },
    { term: "HTML", definition: "Linguagem de Marcação de Hipertexto" },
    { term: "CSS", definition: "Folhas de Estilo em Cascata" },
  ]

  const filteredItems = glossaryItems.filter(
    (item) =>
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
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
          <div className="max-h-[300px] overflow-y-auto">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <div key={index} className="grid grid-cols-2 p-2 border-t hover:bg-muted/50">
                  <div>{item.term}</div>
                  <div>{item.definition}</div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground">Nenhum termo encontrado</div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button>Adicionar Termo</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
