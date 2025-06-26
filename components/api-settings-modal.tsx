"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Check, ExternalLink } from "lucide-react"

interface ApiSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSaveSettings: (settings: ApiSettings) => void
  currentSettings: ApiSettings
}

export interface ApiSettings {
  geminiApiKey: string
  openaiApiKey: string
  anthropicApiKey: string
  useLocalStorage: boolean
}

export default function ApiSettingsModal({ isOpen, onClose, onSaveSettings, currentSettings }: ApiSettingsModalProps) {
  const [settings, setSettings] = useState<ApiSettings>({
    ...currentSettings,
    geminiApiKey: currentSettings.geminiApiKey || "",
    openaiApiKey: currentSettings.openaiApiKey || "",
    anthropicApiKey: currentSettings.anthropicApiKey || "",
  })
  const [testStatus, setTestStatus] = useState<{
    isLoading: boolean
    success?: boolean
    message?: string
  }>({
    isLoading: false,
  })

  const handleSave = () => {
    onSaveSettings(settings)
    onClose()
  }

  const handleTestConnection = async () => {
    setTestStatus({ isLoading: true })

    try {
      // Simples teste de conexão
      const testText = "Hello world"
      const sourceLang = "en"
      const targetLang = "pt"

      const response = await fetch("/api/test-gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: testText,
          sourceLang,
          targetLang,
          apiKey: settings.geminiApiKey,
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configurações de API de Tradução</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="gemini-api-key">Chave de API do Google Gemini</Label>
            <Input
              id="gemini-api-key"
              type="password"
              value={settings.geminiApiKey}
              onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
              placeholder="Insira sua chave de API do Google Gemini"
            />
            <div className="text-xs text-muted-foreground space-y-2">
              <p>
                Você pode obter uma chave de API no{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline dark:text-blue-400 inline-flex items-center"
                >
                  Google AI Studio
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </p>
              <p className="text-amber-600 dark:text-amber-400 flex items-start">
                <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
                <span>
                  Certifique-se de que sua chave de API tenha acesso ao modelo Gemini 1.5 Flash e que você tenha ativado
                  a API Gemini no seu projeto Google Cloud.
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
            <Input
              id="openai-api-key"
              type="password"
              value={settings.openaiApiKey}
              onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
              placeholder="Insira sua chave da OpenAI"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="anthropic-api-key">Chave de API da Anthropic</Label>
            <Input
              id="anthropic-api-key"
              type="password"
              value={settings.anthropicApiKey}
              onChange={(e) => setSettings({ ...settings, anthropicApiKey: e.target.value })}
              placeholder="Insira sua chave da Anthropic"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 mt-4">
          <input
            type="checkbox"
            id="use-local-storage"
            checked={settings.useLocalStorage}
            onChange={(e) => setSettings({ ...settings, useLocalStorage: e.target.checked })}
            className="rounded border-gray-300 dark:border-gray-700"
          />
          <Label htmlFor="use-local-storage">Salvar configurações no navegador</Label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar Configurações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
