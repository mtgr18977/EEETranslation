"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Check } from "lucide-react"

interface ApiSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSaveSettings: (settings: ApiSettings) => void
  currentSettings: ApiSettings
}

export interface ApiSettings {
  googleApiKey: string
  libreApiUrl: string
  useLocalStorage: boolean
}

export default function ApiSettingsModal({ isOpen, onClose, onSaveSettings, currentSettings }: ApiSettingsModalProps) {
  const [settings, setSettings] = useState<ApiSettings>(currentSettings)
  const [activeTab, setActiveTab] = useState("google")
  const [testStatus, setTestStatus] = useState<{
    isLoading: boolean
    success?: boolean
    message?: string
    provider?: string
  }>({
    isLoading: false,
  })

  const handleSave = () => {
    onSaveSettings(settings)
    onClose()
  }

  const handleTestConnection = async (provider: "google" | "libre") => {
    setTestStatus({ isLoading: true, provider })

    try {
      // Simples teste de conexão
      const testText = "Hello world"
      const sourceLang = "en"
      const targetLang = "pt"

      let url, body, headers

      if (provider === "google") {
        url = `https://translation.googleapis.com/language/translate/v2?key=${settings.googleApiKey}`
        body = JSON.stringify({
          q: testText,
          source: sourceLang,
          target: targetLang,
        })
        headers = { "Content-Type": "application/json" }
      } else {
        url = settings.libreApiUrl
        body = JSON.stringify({
          q: testText,
          source: sourceLang,
          target: targetLang,
        })
        headers = { "Content-Type": "application/json" }
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body,
      })

      const data = await response.json()

      if (response.ok) {
        setTestStatus({
          isLoading: false,
          success: true,
          message: "Conexão bem-sucedida!",
          provider,
        })
      } else {
        setTestStatus({
          isLoading: false,
          success: false,
          message: `Erro: ${data.error?.message || "Falha na conexão"}`,
          provider,
        })
      }
    } catch (error) {
      setTestStatus({
        isLoading: false,
        success: false,
        message: `Erro: ${error instanceof Error ? error.message : "Falha na conexão"}`,
        provider,
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configurações de API de Tradução</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="google">Google Translate</TabsTrigger>
            <TabsTrigger value="libre">LibreTranslate</TabsTrigger>
          </TabsList>

          <TabsContent value="google" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="google-api-key">Chave de API do Google Translate</Label>
              <Input
                id="google-api-key"
                type="password"
                value={settings.googleApiKey}
                onChange={(e) => setSettings({ ...settings, googleApiKey: e.target.value })}
                placeholder="Insira sua chave de API do Google Cloud"
              />
              <p className="text-xs text-muted-foreground">
                Você pode obter uma chave de API no{" "}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Console do Google Cloud
                </a>
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestConnection("google")}
                disabled={!settings.googleApiKey || testStatus.isLoading}
              >
                {testStatus.isLoading && testStatus.provider === "google" ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Testando...
                  </>
                ) : (
                  "Testar Conexão"
                )}
              </Button>
            </div>

            {testStatus.provider === "google" && testStatus.message && (
              <div
                className={`p-2 text-sm rounded flex items-center ${
                  testStatus.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}
              >
                {testStatus.success ? <Check className="h-4 w-4 mr-2" /> : <AlertCircle className="h-4 w-4 mr-2" />}
                {testStatus.message}
              </div>
            )}
          </TabsContent>

          <TabsContent value="libre" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="libre-api-url">URL da API LibreTranslate</Label>
              <Input
                id="libre-api-url"
                value={settings.libreApiUrl}
                onChange={(e) => setSettings({ ...settings, libreApiUrl: e.target.value })}
                placeholder="https://libretranslate.de/translate"
              />
              <p className="text-xs text-muted-foreground">
                LibreTranslate é uma API de tradução de código aberto. Você pode usar o serviço público ou{" "}
                <a
                  href="https://github.com/LibreTranslate/LibreTranslate"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  hospedar sua própria instância
                </a>
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestConnection("libre")}
                disabled={!settings.libreApiUrl || testStatus.isLoading}
              >
                {testStatus.isLoading && testStatus.provider === "libre" ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Testando...
                  </>
                ) : (
                  "Testar Conexão"
                )}
              </Button>
            </div>

            {testStatus.provider === "libre" && testStatus.message && (
              <div
                className={`p-2 text-sm rounded flex items-center ${
                  testStatus.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}
              >
                {testStatus.success ? <Check className="h-4 w-4 mr-2" /> : <AlertCircle className="h-4 w-4 mr-2" />}
                {testStatus.message}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex items-center space-x-2 mt-4">
          <input
            type="checkbox"
            id="use-local-storage"
            checked={settings.useLocalStorage}
            onChange={(e) => setSettings({ ...settings, useLocalStorage: e.target.checked })}
            className="rounded border-gray-300"
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
