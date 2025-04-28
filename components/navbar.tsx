"use client"

import type React from "react"

import { Upload, Download, Database, Book, Keyboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRef } from "react"
import { useKeyboardShortcuts } from "@/contexts/keyboard-shortcuts-context"

interface NavbarProps {
  onUpload: (content: string) => void
  onDownload: () => void
  onOpenTM: () => void
  onOpenGlossary: () => void
}

export default function Navbar({ onUpload, onDownload, onOpenTM, onOpenGlossary }: NavbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { setShortcutsModalOpen } = useKeyboardShortcuts()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      onUpload(content)
    }
    reader.readAsText(file)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <nav className="bg-amber-100 p-4 flex justify-between">
      <div className="flex gap-4">
        <input type="file" accept=".md,.txt" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

        <Button className="bg-sky-300 hover:bg-sky-400 text-black" onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Upload
        </Button>

        <Button className="bg-sky-300 hover:bg-sky-400 text-black" onClick={onDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>

        <Button className="bg-sky-300 hover:bg-sky-400 text-black" onClick={onOpenTM}>
          <Database className="mr-2 h-4 w-4" />
          MT
        </Button>

        <Button className="bg-sky-300 hover:bg-sky-400 text-black" onClick={onOpenGlossary}>
          <Book className="mr-2 h-4 w-4" />
          Glossário
        </Button>
      </div>

      <Button variant="ghost" size="sm" onClick={() => setShortcutsModalOpen(true)} className="text-muted-foreground">
        <Keyboard className="mr-2 h-4 w-4" />
        Keyboard Shortcuts
        <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-muted rounded">Shift + ?</kbd>
      </Button>
    </nav>
  )
}
