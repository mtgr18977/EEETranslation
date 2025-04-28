"use client"

import { useState, useEffect } from "react"
import Navbar from "@/components/navbar"
import InfoPanel from "@/components/info-panel"
import GlossaryModal from "@/components/glossary-modal"
import { TranslationMemoryModal } from "@/components/translation-memory-modal"
import LanguageSelector from "@/components/language-selector"
import SegmentedTranslator from "@/components/segmented-translator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SourceText from "@/components/source-text"
import TargetText from "@/components/target-text"
import { KeyboardShortcutsProvider } from "@/contexts/keyboard-shortcuts-context"
import { type GlossaryTerm, loadGlossaryFromCSV } from "@/utils/glossary"
import type { ApiSettings } from "@/components/api-settings-modal"

// Chave para armazenar configurações no localStorage
const API_SETTINGS_STORAGE_KEY = "translation-platform-api-settings"

export default function TranslationPlatform() {
  const [sourceText, setSourceText] = useState<string>("")
  const [targetText, setTargetText] = useState<string>("")
  const [showGlossary, setShowGlossary] = useState<boolean>(false)
  const [showTM, setShowTM] = useState<boolean>(false)
  const [sourceLang, setSourceLang] = useState<string>("en")
  const [targetLang, setTargetLang] = useState<string>("pt")
  const [viewMode, setViewMode] = useState<string>("segmented")
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([])
  const [isLoadingGlossary, setIsLoadingGlossary] = useState(false)
  const [apiSettings, setApiSettings] = useState<ApiSettings>({
    googleApiKey: "",
    libreApiUrl: "https://libretranslate.de/translate",
    useLocalStorage: true,
  })

  // URL do glossário
  const glossaryUrl =
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/knowledge-share-terms-2025-04-28-w7A52xOLZShJKyLh1KN2WzIPADca84.csv"

  // Carregar configurações de API do localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem(API_SETTINGS_STORAGE_KEY)
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings)
        setApiSettings(parsedSettings)
      } catch (error) {
        console.error("Erro ao carregar configurações de API:", error)
      }
    }
  }, [])

  // Carregar glossário quando o componente montar
  useEffect(() => {
    setIsLoadingGlossary(true)
    loadGlossaryFromCSV(glossaryUrl)
      .then((terms) => {
        setGlossaryTerms(terms)
        console.log(`Loaded ${terms.length} glossary terms`)
      })
      .catch((err) => {
        console.error("Failed to load glossary:", err)
      })
      .finally(() => {
        setIsLoadingGlossary(false)
      })
  }, [])

  const handleFileUpload = (content: string) => {
    setSourceText(content)
    // Reset target text when new source is uploaded
    setTargetText("")
  }

  const handleDownload = () => {
    if (!targetText) return

    const element = document.createElement("a")
    const file = new Blob([targetText], { type: "text/markdown" })
    element.href = URL.createObjectURL(file)
    element.download = "translated_text.md"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleUpdateApiSettings = (newSettings: ApiSettings) => {
    setApiSettings(newSettings)

    // Salvar no localStorage se a opção estiver ativada
    if (newSettings.useLocalStorage) {
      localStorage.setItem(API_SETTINGS_STORAGE_KEY, JSON.stringify(newSettings))
    } else {
      localStorage.removeItem(API_SETTINGS_STORAGE_KEY)
    }

    // Aqui você poderia atualizar as configurações no servidor se necessário
    console.log("API settings updated:", newSettings)
  }

  return (
    <KeyboardShortcutsProvider>
      <main className="flex flex-col h-screen">
        <Navbar
          onUpload={handleFileUpload}
          onDownload={handleDownload}
          onOpenTM={() => setShowTM(true)}
          onOpenGlossary={() => setShowGlossary(true)}
          onUpdateApiSettings={handleUpdateApiSettings}
          apiSettings={apiSettings}
        />

        <div className="flex flex-1 p-4 gap-4 overflow-hidden">
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-4">
                <LanguageSelector value={sourceLang} onChange={setSourceLang} label="Source" />
                <LanguageSelector value={targetLang} onChange={setTargetLang} label="Target" />
              </div>

              <Tabs value={viewMode} onValueChange={setViewMode} className="w-[400px]">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="segmented">Segmented View</TabsTrigger>
                  <TabsTrigger value="full">Full Text View</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex-1 overflow-auto">
              <Tabs value={viewMode} className="h-full">
                <TabsContent value="segmented" className="mt-0 h-full">
                  <SegmentedTranslator
                    sourceText={sourceText}
                    targetText={targetText}
                    onUpdateTargetText={setTargetText}
                    sourceLang={sourceLang}
                    targetLang={targetLang}
                    glossaryTerms={glossaryTerms}
                    apiSettings={apiSettings}
                  />
                </TabsContent>

                <TabsContent value="full" className="mt-0 h-full flex gap-4">
                  <SourceText text={sourceText} onChange={setSourceText} />
                  <TargetText text={targetText} onChange={setTargetText} />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <InfoPanel sourceText={sourceText} targetText={targetText} sourceLang={sourceLang} targetLang={targetLang} />
        </div>

        {showGlossary && (
          <GlossaryModal isOpen={showGlossary} onClose={() => setShowGlossary(false)} glossaryUrl={glossaryUrl} />
        )}

        {showTM && (
          <TranslationMemoryModal
            isOpen={showTM}
            onClose={() => setShowTM(false)}
            onApply={(segments) => {
              // Logic to apply TM segments to the target text
              console.log("Applying TM segments", segments)
            }}
          />
        )}
      </main>
    </KeyboardShortcutsProvider>
  )
}
