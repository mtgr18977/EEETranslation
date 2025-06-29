"use client"

import type React from "react"

import { Upload, Download, Database, Book, Keyboard, Settings, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRef, useState } from "react"
import { useKeyboardShortcuts } from "@/contexts/keyboard-shortcuts-context"
import ApiSettingsModal, { type ApiSettings } from "./api-settings-modal"
import { ThemeToggle } from "./theme-toggle"

interface NavbarProps {
  onUpload: (content: string) => void
  onDownload: () => void
  onOpenTM: () => void
  onOpenGlossary: () => void
  onUpdateApiSettings?: (settings: ApiSettings) => void
  onClearWork?: () => void
  apiSettings?: ApiSettings
}

export default function Navbar({
  onUpload,
  onDownload,
  onOpenTM,
  onOpenGlossary,
  onUpdateApiSettings,
  onClearWork,
  apiSettings = {
    provider: "gemini",
    geminiApiKey: "AIzaSyB5ANmjzUj251i2G3FHgV7UEV9NH4OwT18",
    openaiApiKey: "",
    anthropicApiKey: "",
    useLocalStorage: true,
  },
}: NavbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { setShortcutsModalOpen } = useKeyboardShortcuts()
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false)

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

  const handleApiSettingsSave = (settings: ApiSettings) => {
    if (onUpdateApiSettings) {
      onUpdateApiSettings(settings)
    }
  }

  return (
    <nav className="bg-slate-50 border-b p-4 flex justify-between dark:bg-slate-900 dark:border-slate-800">
      <div className="flex gap-4">
        <input type="file" accept=".md,.txt" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

        <Button className="bg-zinc-700 hover:bg-zinc-800 text-white" onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Upload
        </Button>

        <Button className="bg-zinc-700 hover:bg-zinc-800 text-white" onClick={onDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>

        <Button className="bg-zinc-700 hover:bg-zinc-800 text-white" onClick={onOpenTM}>
          <Database className="mr-2 h-4 w-4" />
          MT
        </Button>

        <Button className="bg-zinc-700 hover:bg-zinc-800 text-white" onClick={onOpenGlossary}>
          <Book className="mr-2 h-4 w-4" />
          Glossário
        </Button>

        {onClearWork && (
          <Button
            variant="outline"
            className="text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={onClearWork}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Limpar
          </Button>
        )}
      </div>

      <div className="flex gap-2 items-center">
        <ThemeToggle />

        <Button variant="outline" size="sm" onClick={() => setIsApiSettingsOpen(true)}>
          <Settings className="mr-2 h-4 w-4" />
          APIs
        </Button>

        <Button variant="ghost" size="sm" onClick={() => setShortcutsModalOpen(true)} className="text-muted-foreground">
          <Keyboard className="mr-2 h-4 w-4" />
          Keyboard Shortcuts
          <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-muted rounded">Shift + ?</kbd>
        </Button>
      </div>

      {isApiSettingsOpen && (
        <ApiSettingsModal
          isOpen={isApiSettingsOpen}
          onClose={() => setIsApiSettingsOpen(false)}
          onSaveSettings={handleApiSettingsSave}
          currentSettings={apiSettings}
        />
      )}
    </nav>
  )
}
