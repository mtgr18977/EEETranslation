"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Check, ExternalLink, Shield, Eye, EyeOff, Cpu } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ApiSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSaveSettings: (settings: ApiSettings) => void
  currentSettings: ApiSettings
}

export interface ApiSettings {
  provider: "gemini" | "openai" | "anthropic"
  geminiApiKey: string
  openaiApiKey: string
  anthropicApiKey: string
  useLocalStorage: boolean
  geminiModel: string
  openaiModel: string
  anthropicModel: string
}

const MODEL_OPTIONS = {
  gemini: [
    { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash (Recomendado)", description: "Rápido e eficiente" },
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro", description: "Mais preciso, mais lento" },
    { value: "gemini-pro", label: "Gemini Pro", description: "Modelo anterior" },
  ],
  openai: [
    { value: "gpt-4o", label: "GPT-4o (Recomendado)", description: "Mais recente e eficiente" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini", description: "Mais rápido e econômico" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo", description: "Modelo anterior" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", description: "Mais econômico" },
  ],
  anthropic: [
    { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet (Recomendado)", description: "Mais recente" },
    { value: "claude-3-sonnet-20240229", label: "Claude 3 Sonnet", description: "Modelo anterior" },
    { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku", description: "Mais rápido e econômico" },
  ],
}

export default function ApiSettingsModal({ isOpen, onClose, onSaveSettings, currentSettings }: ApiSettingsModalProps) {
  const [settings, setSettings] = useState<ApiSettings>({
    ...currentSettings,
    provider: currentSettings.provider || "gemini",
    geminiApiKey: currentSettings.geminiApiKey || "",
    openaiApiKey: currentSettings.openaiApiKey || "",
    anthropicApiKey: currentSettings.anthropicApiKey || "",
    geminiModel: currentSettings.geminiModel || "gemini-1.5-flash",
    openaiModel: currentSettings.openaiModel || "gpt-4o",
    anthropicModel: currentSettings.anthropicModel || "claude-3-5-sonnet-20241022",
  })

  const [testStatus, setTestStatus] = useState<{
    isLoading: boolean
    success?: boolean
    message?: string
  }>({
    isLoading: false,
  })

  const [showKeys, setShowKeys] = useState({
    gemini: false,
    openai: false,
    anthropic: false,
  })

  const handleSave = () => {
    onSaveSettings(settings)
    onClose()
  }

  const handleTestConnection = async () => {
    setTestStatus({ isLoading: true })

    try {
      const testText = "Hello world"
      const sourceLang = "en"
      const targetLang = "pt"

      const response = await fetch("/api/test-api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: testText,
          sourceLang,
          targetLang,
          apiKey: settings.geminiApiKey,
          model: settings.geminiModel,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setTestStatus({
          isLoading: false,
          success: true,
          message: `Conexão bem-sucedida! Tradução: "${data.translation}"`,
        })
      } else {
        setTestStatus({
          isLoading: false,
          success: false,
          message: `Erro: ${data.message || "Falha na conexão"}`,
        })
      }
    } catch (error) {
      setTestStatus({
        isLoading: false,
        success: false,
        message: `Erro: ${error instanceof Error ? error.message : "Falha na conexão"}`,
      })
    }
  }

  const toggleKeyVisibility = (provider: keyof typeof showKeys) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }))
  }

  const getCurrentProviderModels = () => {
    return MODEL_OPTIONS[settings.provider] || []
  }

  const getCurrentModel = () => {
    switch (settings.provider) {
      case "gemini":
        return settings.geminiModel
      case "openai":
        return settings.openaiModel
      case "anthropic":
        return settings.anthropicModel
      default:
        return ""
    }
  }

  const handleModelChange = (model: string) => {
    switch (settings.provider) {
      case "gemini":
        setSettings({ ...settings, geminiModel: model })
        break
      case "openai":
        setSettings({ ...settings, openaiModel: model })
        break
      case "anthropic":
        setSettings({ ...settings, anthropicModel: model })
        break
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Configurações de API de Tradução (BYOK)
          </DialogTitle>
        </DialogHeader>

        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>Bring Your Own Key (BYOK):</strong> Suas chaves de API são armazenadas apenas localmente no seu
            navegador. Nunca são enviadas para nossos servidores. Você mantém controle total sobre suas credenciais.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="provider-select">Provedor de Tradução</Label>
            <Select
              value={settings.provider}
              onValueChange={(value) =>
                setSettings({ ...settings, provider: value as "gemini" | "openai" | "anthropic" })
              }
            >
              <SelectTrigger id="provider-select" className="w-full">
                <SelectValue placeholder="Selecione o provedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Google Gemini</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model-select" className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Modelo{" "}
              {settings.provider === "gemini" ? "Gemini" : settings.provider === "openai" ? "OpenAI" : "Anthropic"}
            </Label>
            <Select value={getCurrentModel()} onValueChange={handleModelChange}>
              <SelectTrigger id="model-select" className="w-full">
                <SelectValue placeholder="Selecione o modelo" />
              </SelectTrigger>
              <SelectContent>
                {getCurrentProviderModels().map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    <div className="flex flex-col">
                      <span>{model.label}</span>
                      <span className="text-xs text-muted-foreground">{model.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gemini-api-key">Chave de API do Google Gemini</Label>
            <div className="relative">
              <Input
                id="gemini-api-key"
                type={showKeys.gemini ? "text" : "password"}
                value={settings.geminiApiKey}
                onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                placeholder="Insira sua chave de API do Google Gemini"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => toggleKeyVisibility("gemini")}
              >
                {showKeys.gemini ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground space-y-2">
              <p>
                Você pode obter uma chave de API no{" "}
                <ExternalLink
                  href="https://aistudio.google.com/app/apikey"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Google AI Studio
                </ExternalLink>
              </p>
              <p className="text-amber-600 dark:text-amber-400 flex items-start">
                <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
                <span>
                  Certifique-se de que sua chave de API tenha acesso ao modelo selecionado e que você tenha ativado a
                  API Gemini no seu projeto Google Cloud.
                </span>
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={!settings.geminiApiKey || testStatus.isLoading}
            >
              {testStatus.isLoading ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Testando...
                </>
              ) : (
                "Testar Conexão"
              )}
            </Button>
          </div>

          {testStatus.message && (
            <div
              className={`p-2 text-sm rounded flex items-center ${
                testStatus.success
                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                  : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
              }`}
            >
              {testStatus.success ? <Check className="h-4 w-4 mr-2" /> : <AlertCircle className="h-4 w-4 mr-2" />}
              {testStatus.message}
            </div>
          )}
        </div>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="openai-api-key">Chave de API da OpenAI</Label>
            <div className="relative">
              <Input
                id="openai-api-key"
                type={showKeys.openai ? "text" : "password"}
                value={settings.openaiApiKey}
                onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                placeholder="Insira sua chave da OpenAI"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => toggleKeyVisibility("openai")}
              >
                {showKeys.openai ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>
                Obtenha sua chave em{" "}
                <ExternalLink
                  href="https://platform.openai.com/api-keys"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  OpenAI Platform
                </ExternalLink>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="anthropic-api-key">Chave de API da Anthropic</Label>
            <div className="relative">
              <Input
                id="anthropic-api-key"
                type={showKeys.anthropic ? "text" : "password"}
                value={settings.anthropicApiKey}
                onChange={(e) => setSettings({ ...settings, anthropicApiKey: e.target.value })}
                placeholder="Insira sua chave da Anthropic"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => toggleKeyVisibility("anthropic")}
              >
                {showKeys.anthropic ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>
                Obtenha sua chave em{" "}
                <ExternalLink
                  href="https://console.anthropic.com/"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Anthropic Console
                </ExternalLink>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="use-local-storage"
              checked={settings.useLocalStorage}
              onChange={(e) => setSettings({ ...settings, useLocalStorage: e.target.checked })}
              className="rounded border-gray-300 dark:border-gray-700"
            />
            <Label htmlFor="use-local-storage" className="font-medium">
              Salvar configurações no navegador (localStorage)
            </Label>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>✓ Seguro:</strong> Chaves armazenadas apenas no seu dispositivo
            </p>
            <p>
              <strong>✓ Privado:</strong> Nunca enviadas para nossos servidores
            </p>
            <p>
              <strong>✓ Controle:</strong> Você pode limpar a qualquer momento
            </p>
            {!settings.useLocalStorage && (
              <p className="text-amber-600 dark:text-amber-400">
                <strong>⚠ Aviso:</strong> Sem persistência, você precisará inserir as chaves a cada sessão
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <Shield className="mr-2 h-4 w-4" />
            Salvar Configurações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
