"use client"

import { useState, useEffect } from "react"
import Navbar from "@/components/navbar"
import InfoPanel from "@/components/info-panel"
import GlossaryModal from "@/components/glossary-modal"
import { TranslationMemoryModal } from "@/components/translation-memory-modal"
import LanguageSelector from "@/components/translation/language-selector"
import SegmentedTranslator from "@/components/translation/segmented-translator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SourceText from "@/components/source-text"
import TargetText from "@/components/target-text"
import { KeyboardShortcutsProvider } from "@/contexts/keyboard-shortcuts-context"
import { type GlossaryTerm, loadGlossaryFromCSV } from "@/utils/glossary"
import type { ApiSettings } from "@/components/api-settings-modal"
import { ArrowLeftRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { STORAGE_KEYS, DEFAULT_SETTINGS, DEFAULT_URLS } from "@/utils/constants"
import { usePersistentState } from "@/hooks/use-persistent-state"
import { useToast } from "@/hooks/use-toast"

export default function TranslationPlatform() {
  // Usar estado persistente para os textos e configurações
  const [sourceText, setSourceText] = usePersistentState<string>(STORAGE_KEYS.SOURCE_TEXT, "")
  const [targetText, setTargetText] = usePersistentState<string>(STORAGE_KEYS.TARGET_TEXT, "")
  const [sourceLang, setSourceLang] = usePersistentState<string>(STORAGE_KEYS.SOURCE_LANG, "en")
  const [targetLang, setTargetLang] = usePersistentState<string>(STORAGE_KEYS.TARGET_LANG, "pt")
  const [viewMode, setViewMode] = usePersistentState<string>(STORAGE_KEYS.VIEW_MODE, "segmented")

  // Estados não persistentes
  const [showGlossary, setShowGlossary] = useState<boolean>(false)
  const [showTM, setShowTM] = useState<boolean>(false)
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([])
  const [isLoadingGlossary, setIsLoadingGlossary] = useState(false)
  const [apiSettings, setApiSettings] = useState<ApiSettings>(DEFAULT_SETTINGS.API)

  // Toast para notificações
  const { toast } = useToast()

  // Carregar configurações de API do localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEYS.API_SETTINGS)
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings)
        setApiSettings(parsedSettings)
      } catch (error) {
        console.error("Erro ao carregar configurações de API:", error)
      }
    }

    // Notificar o usuário se houver um rascunho salvo
    if (sourceText || targetText) {
      toast({
        title: "Rascunho carregado",
        description: "Seu trabalho anterior foi restaurado automaticamente.",
        duration: 3000,
      })
    }
  }, [sourceText, targetText, toast])

  // Carregar glossário quando o componente montar
  useEffect(() => {
    setIsLoadingGlossary(true)
    loadGlossaryFromCSV(DEFAULT_URLS.GLOSSARY)
      .then((terms) => {
        setGlossaryTerms(terms)
        console.log(`Loaded ${terms.length} glossary terms`)
      })
      .catch((err) => {
        console.error("Failed to load glossary:", err)
        toast({
          title: "Erro ao carregar glossário",
          description: "Não foi possível carregar os termos do glossário.",
          variant: "destructive",
        })
      })
      .finally(() => {
        setIsLoadingGlossary(false)
      })
  }, [toast])

  const handleFileUpload = (content: string) => {
    // Perguntar ao usuário se deseja substituir o texto atual se houver conteúdo
    if (sourceText.trim()) {
      if (window.confirm("Isso substituirá o texto atual. Deseja continuar?")) {
        setSourceText(content)
        // Reset target text when new source is uploaded
        setTargetText("")
        toast({
          title: "Arquivo carregado",
          description: "O texto fonte foi atualizado com sucesso.",
        })
      }
    } else {
      setSourceText(content)
      setTargetText("")
      toast({
        title: "Arquivo carregado",
        description: "O texto fonte foi carregado com sucesso.",
      })
    }
  }

  const handleDownload = () => {
    if (!targetText) {
      toast({
        title: "Nada para baixar",
        description: "O texto traduzido está vazio.",
        variant: "destructive",
      })
      return
    }

    const element = document.createElement("a")
    const file = new Blob([targetText], { type: "text/markdown" })
    element.href = URL.createObjectURL(file)
    element.download = "translated_text.md"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)

    toast({
      title: "Download concluído",
      description: "O arquivo foi baixado com sucesso.",
    })
  }

  const handleUpdateApiSettings = (newSettings: ApiSettings) => {
    setApiSettings(newSettings)

    // Salvar no localStorage se a opção estiver ativada
    if (newSettings.useLocalStorage) {
      localStorage.setItem(STORAGE_KEYS.API_SETTINGS, JSON.stringify(newSettings))
      toast({
        title: "Configurações salvas",
        description: "Suas configurações de API foram salvas localmente.",
      })
    } else {
      localStorage.removeItem(STORAGE_KEYS.API_SETTINGS)
      toast({
        title: "Configurações atualizadas",
        description: "Suas configurações de API foram atualizadas (sem persistência).",
      })
    }

    console.log("API settings updated:", newSettings)
  }

  // Função para inverter os idiomas
  const handleSwapLanguages = () => {
    // Inverter os idiomas
    const tempLang = sourceLang
    setSourceLang(targetLang)
    setTargetLang(tempLang)

    // Se estiver na visualização completa e houver texto, também inverter os textos
    if (viewMode === "full" && sourceText && targetText) {
      setSourceText(targetText)
      setTargetText(sourceText)
      toast({
        title: "Idiomas invertidos",
        description: "Os idiomas de origem e destino foram trocados.",
      })
    }
  }

  // Função para limpar o trabalho atual
  const handleClearWork = () => {
    if (window.confirm("Tem certeza que deseja limpar todo o trabalho atual? Esta ação não pode ser desfeita.")) {
      setSourceText("")
      setTargetText("")
      toast({
        title: "Trabalho limpo",
        description: "Todo o conteúdo foi removido.",
      })
    }
  }

  return (
    <KeyboardShortcutsProvider>
      <main className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar
          onUpload={handleFileUpload}
          onDownload={handleDownload}
          onOpenTM={() => setShowTM(true)}
          onOpenGlossary={() => setShowGlossary(true)}
          onUpdateApiSettings={handleUpdateApiSettings}
          onClearWork={handleClearWork}
          apiSettings={apiSettings}
        />

        <div className="flex flex-1 p-4 gap-4 overflow-hidden">
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <div className="flex items-end">
                  <LanguageSelector value={sourceLang} onChange={setSourceLang} label="Source" />

                  <div className="flex items-center justify-center w-12 h-10 mb-[1px]">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 flex-shrink-0"
                      onClick={handleSwapLanguages}
                      title="Inverter direção da tradução"
                    >
                      <ArrowLeftRight className="h-5 w-5" />
                    </Button>
                  </div>

                  <LanguageSelector value={targetLang} onChange={setTargetLang} label="Target" />
                </div>
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
          <GlossaryModal
            isOpen={showGlossary}
            onClose={() => setShowGlossary(false)}
            glossaryUrl={DEFAULT_URLS.GLOSSARY}
          />
        )}

        {showTM && (
          <TranslationMemoryModal
            isOpen={showTM}
            onClose={() => setShowTM(false)}
            onApply={(segments) => {
              // Logic to apply TM segments to the target text
              console.log("Applying TM segments", segments)
              toast({
                title: "Memória de tradução aplicada",
                description: `${segments.length} segmentos foram aplicados.`,
              })
            }}
          />
        )}
      </main>
    </KeyboardShortcutsProvider>
  )
}
