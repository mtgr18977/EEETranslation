"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Upload, FileText, Save, Trash2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TranslationPair {
  id: string
  portuguese: string
  english: string
  category?: string
}

interface UploadedFile {
  name: string
  content: string
  language: "pt" | "en"
}

export function TextUploadForm() {
  const [category, setCategory] = useState("")
  const [translationPairs, setTranslationPairs] = useState<TranslationPair[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, language: "pt" | "en") => {
    const file = event.target.files?.[0]
    if (!file) return

    const validExtensions = [".md", ".txt"]
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))

    if (!validExtensions.includes(fileExtension)) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione apenas arquivos .md ou .txt",
        variant: "destructive",
      })
      return
    }

    try {
      const content = await file.text()

      const filteredFiles = uploadedFiles.filter((f) => f.language !== language)
      const newFile: UploadedFile = {
        name: file.name,
        content,
        language,
      }

      setUploadedFiles([...filteredFiles, newFile])

      toast({
        title: "Arquivo carregado",
        description: `Arquivo ${language.toUpperCase()} carregado com sucesso!`,
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao ler o arquivo. Verifique se é um arquivo de texto válido.",
        variant: "destructive",
      })
    }

    event.target.value = ""
  }

  const processFiles = async () => {
    if (uploadedFiles.length !== 2) {
      toast({
        title: "Arquivos incompletos",
        description: "Por favor, faça upload de ambos os arquivos (PT e EN).",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      const ptFile = uploadedFiles.find((f) => f.language === "pt")
      const enFile = uploadedFiles.find((f) => f.language === "en")

      if (!ptFile || !enFile) return

      const ptSentences = splitIntoSentences(ptFile.content)
      const enSentences = splitIntoSentences(enFile.content)

      const pairs: TranslationPair[] = []
      const maxLength = Math.max(ptSentences.length, enSentences.length)

      for (let i = 0; i < maxLength; i++) {
        const ptText = ptSentences[i]?.trim() || ""
        const enText = enSentences[i]?.trim() || ""

        if (ptText && enText) {
          pairs.push({
            id: `${Date.now()}-${i}`,
            portuguese: ptText,
            english: enText,
            category: category.trim() || undefined,
          })
        }
      }

      setTranslationPairs(pairs)

      toast({
        title: "Processamento concluído",
        description: `${pairs.length} pares de tradução foram criados automaticamente!`,
      })
    } catch (error) {
      toast({
        title: "Erro no processamento",
        description: "Erro ao processar os arquivos. Verifique o conteúdo dos arquivos.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const splitIntoSentences = (text: string): string[] => {
    // Remove markdown headers e formatação básica
    const cleanText = text
      .replace(/^#+\s+/gm, "") // Remove headers markdown
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
      .replace(/\*(.*?)\*/g, "$1") // Remove italic
      .replace(/`(.*?)`/g, "$1") // Remove code inline

    // Divide em sentenças usando pontuação
    return cleanText
      .split(/[.!?]+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 10) // Remove sentenças muito curtas
  }

  const removePair = (id: string) => {
    setTranslationPairs((prev) => prev.filter((pair) => pair.id !== id))
  }

  const saveToMemory = () => {
    if (translationPairs.length === 0) {
      toast({
        title: "Erro",
        description: "Processe os arquivos primeiro para gerar pares de tradução.",
        variant: "destructive",
      })
      return
    }

    // Salvar no localStorage por enquanto
    const existingMemory = JSON.parse(localStorage.getItem("translationMemory") || "[]")
    const updatedMemory = [...existingMemory, ...translationPairs]
    localStorage.setItem("translationMemory", JSON.stringify(updatedMemory))

    setTranslationPairs([])
    setUploadedFiles([])
    setCategory("")

    toast({
      title: "Sucesso",
      description: `${translationPairs.length} pares de tradução salvos na memória!`,
    })
  }

  const clearFiles = () => {
    setUploadedFiles([])
    setTranslationPairs([])
  }

  return (
    <div className="space-y-6">
      {/* File Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Documentos
          </CardTitle>
          <CardDescription>
            Faça upload de dois arquivos (.md ou .txt): um em português e outro em inglês
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pt-file">Arquivo em Português (.md ou .txt)</Label>
              <Input
                id="pt-file"
                type="file"
                accept=".md,.txt"
                onChange={(e) => handleFileUpload(e, "pt")}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {uploadedFiles.find((f) => f.language === "pt") && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <FileText className="h-4 w-4" />
                  {uploadedFiles.find((f) => f.language === "pt")?.name}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="en-file">Arquivo em Inglês (.md ou .txt)</Label>
              <Input
                id="en-file"
                type="file"
                accept=".md,.txt"
                onChange={(e) => handleFileUpload(e, "en")}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {uploadedFiles.find((f) => f.language === "en") && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <FileText className="h-4 w-4" />
                  {uploadedFiles.find((f) => f.language === "en")?.name}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria (opcional)</Label>
            <Input
              id="category"
              placeholder="Ex: Técnico, Jurídico, Marketing..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          {uploadedFiles.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {uploadedFiles.length === 2
                  ? "Ambos os arquivos carregados! Clique em 'Processar Arquivos' para gerar os pares de tradução."
                  : `${uploadedFiles.length}/2 arquivos carregados. Faça upload do arquivo restante.`}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button onClick={processFiles} disabled={uploadedFiles.length !== 2 || isProcessing} className="flex-1">
              {isProcessing ? "Processando..." : "Processar Arquivos"}
            </Button>
            {uploadedFiles.length > 0 && (
              <Button variant="outline" onClick={clearFiles}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Translation Pairs List */}
      {translationPairs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pares de Tradução Processados ({translationPairs.length})</CardTitle>
            <CardDescription>Revise os pares gerados automaticamente antes de salvar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {translationPairs.map((pair, index) => (
                <div key={pair.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Par #{index + 1}</span>
                    <div className="flex items-center gap-2">
                      {pair.category && <Badge variant="secondary">{pair.category}</Badge>}
                      <Button variant="ghost" size="sm" onClick={() => removePair(pair.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">PORTUGUÊS</Label>
                      <p className="text-sm mt-1">{pair.portuguese}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">INGLÊS</Label>
                      <p className="text-sm mt-1">{pair.english}</p>
                    </div>
                  </div>
                </div>
              ))}

              <Separator />

              <Button onClick={saveToMemory} className="w-full" size="lg">
                <Save className="h-4 w-4 mr-2" />
                Salvar {translationPairs.length} Pares na Memória
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
