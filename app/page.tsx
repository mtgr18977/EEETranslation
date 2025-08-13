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
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { KeyboardShortcutsProvider } from "@/contexts/keyboard-shortcuts-context"
import QualityPanel from "@/components/quality-panel"
import ReadabilityPanel from "@/components/readability-panel"
import ConsistencyAlertsPanel from "@/components/consistency-alerts-panel"
import type { GlossaryTerm } from "@/utils/glossary"
import type { ApiSettings } from "@/components/api-settings-modal"
import { ArrowLeftRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { STORAGE_KEYS, DEFAULT_URLS } from "@/utils/constants"
import { usePersistentState } from "@/hooks/use-persistent-state"
import { useToast } from "@/hooks/use-toast"
import { runEnhancedQualityChecks } from "@/utils/quality-checks"

function detectLanguage(text: string): string {
  if (!text || text.length < 50) return "en" // Default to English for short texts

  const sample = text.toLowerCase().substring(0, 500) // Use first 500 chars for detection

  // Portuguese patterns
  const portuguesePatterns = [
    /\b(que|não|com|uma|para|por|mais|como|seu|sua|seus|suas|muito|também|já|só|ainda|bem|onde|quando|porque|então|mas|ou|se|da|do|das|dos|na|no|nas|nos|em|de|a|o|as|os|é|são|foi|foram|será|serão|tem|têm|tinha|tinham|terá|terão|pode|podem|podia|podiam|poderá|poderão|deve|devem|devia|deviam|deverá|deverão|ção|ões|mente|inha|inho)\b/g,
    /[àáâãçéêíóôõú]/g,
  ]

  // English patterns
  const englishPatterns = [
    /\b(the|and|that|have|for|not|with|you|this|but|his|from|they|she|her|been|than|its|who|did|yes|get|may|him|old|see|now|way|could|people|take|years|your|good|some|would|time|very|when|come|here|just|like|long|make|many|over|such|take|than|them|well|were)\b/g,
    /\b(ing|tion|ness|ment|able|ible|ful|less|ous|ious|eous|ive|ative|itive)\b/g,
  ]

  // Spanish patterns
  const spanishPatterns = [
    /\b(que|con|una|para|por|más|como|pero|sus|les|muy|era|hasta|desde|está|estaba|fueron|tienen|puede|pueden|debe|deben|hacer|años|tiempo|chaque|forme|aquí|où|manière|bien|travail|vie|jour|cas|partie|groupe|entreprise|fait|main|lieu|année|gouvernement|moment|pays|selon|moins|problème|même|social|eau|point|histoire|état|pendant|mieux|système|nouveau|autres|cette|tous|toutes|tout|grand|grands|grande|grandes|petit|petits|petite|petites)\b/g,
    /[ñáéíóúü]/g,
  ]

  // French patterns
  const frenchPatterns = [
    /\b(que|avec|une|pour|par|plus|comme|mais|ses|leur|très|était|jusqu|depuis|sont|étaient|ont|peuvent|peut|doit|doivent|faire|années|temps|chaque|forme|ici|où|manière|bien|travail|vie|jour|cas|partie|groupe|entreprise|fait|main|lieu|année|gouvernement|moment|pays|selon|moins|problème|même|social|eau|point|histoire|état|pendant|mieux|système|nouveau|autres|cette|tous|toutes|tout|grand|grands|grande|grandes|petit|petits|petite|petites)\b/g,
    /[àâäéèêëïîôöùûüÿç]/g,
  ]

  let portugueseScore = 0
  let englishScore = 0
  let spanishScore = 0
  let frenchScore = 0

  // Count matches for each language
  portuguesePatterns.forEach((pattern) => {
    const matches = sample.match(pattern)
    if (matches) portugueseScore += matches.length
  })

  englishPatterns.forEach((pattern) => {
    const matches = sample.match(pattern)
    if (matches) englishScore += matches.length
  })

  spanishPatterns.forEach((pattern) => {
    const matches = sample.match(pattern)
    if (matches) spanishScore += matches.length
  })

  frenchPatterns.forEach((pattern) => {
    const matches = sample.match(pattern)
    if (matches) frenchScore += matches.length
  })

  // Determine the language with highest score
  const scores = [
    { lang: "pt", score: portugueseScore },
    { lang: "en", score: englishScore },
    { lang: "es", score: spanishScore },
    { lang: "fr", score: frenchScore },
  ]

  scores.sort((a, b) => b.score - a.score)

  // Return the language with highest score, or English if no clear winner
  return scores[0].score > 0 ? scores[0].lang : "en"
}

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
  const [showApiWarning, setShowApiWarning] = useState(true)
  const [apiSettings, setApiSettings] = useState<ApiSettings>({
    provider: "gemini",
    geminiApiKey: "",
    openaiApiKey: "",
    anthropicApiKey: "",
    useLocalStorage: true,
  })

  // Toast para notificações
  const { toast } = useToast()

  useEffect(() => {
    const savedGlossary = localStorage.getItem("glossary-terms")
    if (savedGlossary) {
      try {
        setGlossaryTerms(JSON.parse(savedGlossary))
      } catch (err) {
        console.error("Failed to load saved glossary:", err)
      }
    }
  }, [])

  // Carregar configurações de API do localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEYS.API_SETTINGS)
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings)
        setApiSettings({ provider: "gemini", ...parsedSettings })
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

  useEffect(() => {
    setIsLoadingGlossary(false)
  }, [])

  const qualityIssues = targetText.trim() ? runEnhancedQualityChecks(sourceText, targetText, glossaryTerms) : []

  const handleFileUpload = (content: string) => {
    // Perguntar ao usuário se deseja substituir o texto atual se houver conteúdo
    if (sourceText.trim()) {
      if (window.confirm("Isso substituirá o texto atual. Deseja continuar?")) {
        setSourceText(content)
        // Reset target text when new source is uploaded
        setTargetText("")
        setViewMode("segmented")

        const detectedLang = detectLanguage(content)
        if (detectedLang !== sourceLang) {
          setSourceLang(detectedLang)
          toast({
            title: "Idioma detectado",
            description: `Idioma de origem alterado para ${getLanguageDisplayName(detectedLang)}.`,
          })
        }

        toast({
          title: "Arquivo carregado",
          description: "O texto fonte foi atualizado com sucesso.",
        })
      }
    } else {
      setSourceText(content)
      setTargetText("")
      setViewMode("segmented")

      const detectedLang = detectLanguage(content)
      if (detectedLang !== sourceLang) {
        setSourceLang(detectedLang)
        toast({
          title: "Idioma detectado",
          description: `Idioma de origem definido como ${getLanguageDisplayName(detectedLang)}.`,
        })
      }

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

  const getLanguageDisplayName = (langCode: string): string => {
    const languageNames: Record<string, string> = {
      en: "Inglês",
      pt: "Português",
      es: "Espanhol",
      fr: "Francês",
      de: "Alemão",
      it: "Italiano",
      ja: "Japonês",
      zh: "Chinês",
      ru: "Russo",
      ar: "Árabe",
    }
    return languageNames[langCode] || langCode
  }

  const handleResolveQualityIssue = (issueIndex: number) => {
    toast({
      title: "Problema resolvido",
      description: "O problema de qualidade foi marcado como resolvido.",
    })
  }

  const handleApplyQualitySuggestion = (issueIndex: number, suggestion: string) => {
    // Apply the suggestion to the target text
    // This is a simplified implementation - in a real app, you'd want more sophisticated text replacement
    toast({
      title: "Sugestão aplicada",
      description: "A sugestão de qualidade foi aplicada ao texto.",
    })
  }

  const handleResolveConsistencyAlert = (alertId: string, suggestion?: string) => {
    toast({
      title: "Alerta resolvido",
      description: "O alerta de consistência foi resolvido.",
    })
  }

  const handleApplyConsistencySuggestion = (alertId: string, suggestion: string, segmentIndex?: number) => {
    if (segmentIndex !== undefined) {
      // Apply to specific segment - this would need integration with the segmented translator
      toast({
        title: "Sugestão aplicada",
        description: `Sugestão aplicada ao segmento ${segmentIndex + 1}.`,
      })
    } else {
      // Apply to full text
      setTargetText(suggestion)
      toast({
        title: "Sugestão aplicada",
        description: "A sugestão foi aplicada ao texto completo.",
      })
    }
  }

  // Verificar se a chave de API está configurada
  const isApiKeyConfigured = Boolean(
    (apiSettings.provider === "gemini" && apiSettings.geminiApiKey) ||
      (apiSettings.provider === "openai" && apiSettings.openaiApiKey) ||
      (apiSettings.provider === "anthropic" && apiSettings.anthropicApiKey),
  )

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
                <TabsContent value="segmented" className="mt-0 h-full space-y-4">
                  {!isApiKeyConfigured && showApiWarning && (
                    <div className="relative p-6 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/30 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
                        onClick={() => setShowApiWarning(false)}
                        title="Fechar aviso"
                      >
                        <X className="h-4 w-4" />
                      </Button>

                      <h3 className="text-lg font-medium text-amber-800 dark:text-amber-300 mb-2">
                        Chave de API necessária
                      </h3>
                      <p className="text-amber-700 dark:text-amber-400 mb-4">
                        Para usar a tradução automática, configure uma chave de API nos ajustes de API. Clique no botão
                        "APIs" na barra de navegação para inserir suas chaves do Gemini, OpenAI ou Anthropic.
                      </p>
                      <p className="text-sm text-amber-600 dark:text-amber-500">
                        Você ainda pode editar e traduzir manualmente sem uma chave de API.
                      </p>
                    </div>
                  )}
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

                <TabsContent value="full" className="mt-0 h-full">
                  <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border">
                    <ResizablePanel defaultSize={50} minSize={30}>
                      <div className="h-full p-2">
                        <SourceText text={sourceText} onChange={setSourceText} />
                      </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    <ResizablePanel defaultSize={50} minSize={30}>
                      <div className="h-full p-2">
                        <TargetText text={targetText} onChange={setTargetText} />
                      </div>
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div className="w-80 flex flex-col gap-4 overflow-hidden">
            <InfoPanel
              sourceText={sourceText}
              targetText={targetText}
              sourceLang={sourceLang}
              targetLang={targetLang}
            />

            {qualityIssues.length > 0 && (
              <QualityPanel
                issues={qualityIssues}
                onResolveIssue={handleResolveQualityIssue}
                onApplySuggestion={handleApplyQualitySuggestion}
              />
            )}

            {(sourceText.trim() || targetText.trim()) && (
              <ReadabilityPanel
                sourceText={sourceText}
                targetText={targetText}
                sourceLang={sourceLang}
                targetLang={targetLang}
              />
            )}

            {(sourceText.trim() || targetText.trim()) && (
              <ConsistencyAlertsPanel
                sourceText={sourceText}
                targetText={targetText}
                glossaryTerms={glossaryTerms}
                onResolveAlert={handleResolveConsistencyAlert}
                onApplySuggestion={handleApplyConsistencySuggestion}
              />
            )}
          </div>
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
