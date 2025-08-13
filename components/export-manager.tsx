"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Download, Upload, FileText, Settings } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface TranslationPair {
  id: string
  portuguese: string
  english: string
  category?: string
}

type ExportFormat = "tmx" | "csv" | "json" | "txt"

export function ExportManager() {
  const [translationMemory, setTranslationMemory] = useState<TranslationPair[]>([])
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("tmx")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [fileName, setFileName] = useState("memoria-traducao")
  const { toast } = useToast()

  useEffect(() => {
    const memory = JSON.parse(localStorage.getItem("translationMemory") || "[]")
    setTranslationMemory(memory)
  }, [])

  const categories = Array.from(new Set(translationMemory.map((pair) => pair.category).filter(Boolean)))

  const getFilteredMemory = () => {
    if (selectedCategories.length === 0) return translationMemory
    return translationMemory.filter((pair) => pair.category && selectedCategories.includes(pair.category))
  }

  const generateTMX = (data: TranslationPair[]): string => {
    const header = `<?xml version="1.0" encoding="UTF-8"?>
<tmx version="1.4">
  <header creationtool="Tradutor" creationtoolversion="1.0" datatype="plaintext" segtype="sentence" adminlang="pt-BR" srclang="pt-BR" o-tmf="none">
  </header>
  <body>`

    const segments = data
      .map(
        (pair, index) => `
    <tu tuid="${pair.id || index}">
      <tuv xmlLang="pt-BR">
        <seg>${escapeXml(pair.portuguese)}</seg>
      </tuv>
      <tuv xmlLang="en-US">
        <seg>${escapeXml(pair.english)}</seg>
      </tuv>
    </tu>`,
      )
      .join("")

    const footer = `
  </body>
</tmx>`

    return header + segments + footer
  }

  const generateCSV = (data: TranslationPair[]): string => {
    const headers = includeMetadata ? "ID,Português,Inglês,Categoria\n" : "Português,Inglês\n"

    const rows = data
      .map((pair) => {
        const pt = `"${pair.portuguese.replace(/"/g, '""')}"`
        const en = `"${pair.english.replace(/"/g, '""')}"`

        if (includeMetadata) {
          const category = `"${pair.category || ""}"`
          return `${pair.id},${pt},${en},${category}`
        }
        return `${pt},${en}`
      })
      .join("\n")

    return headers + rows
  }

  const generateJSON = (data: TranslationPair[]): string => {
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalPairs: data.length,
        categories: categories,
        format: "Tradutor Translation Memory v1.0",
      },
      translationPairs: includeMetadata ? data : data.map(({ id, category, ...pair }) => pair),
    }
    return JSON.stringify(exportData, null, 2)
  }

  const generateTXT = (data: TranslationPair[]): string => {
    return data
      .map((pair, index) => {
        let text = `=== Par ${index + 1} ===\n`
        text += `PT: ${pair.portuguese}\n`
        text += `EN: ${pair.english}\n`
        if (includeMetadata && pair.category) {
          text += `Categoria: ${pair.category}\n`
        }
        return text
      })
      .join("\n")
  }

  const escapeXml = (text: string): string => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;")
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExport = () => {
    const filteredData = getFilteredMemory()

    if (filteredData.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum dado para exportar com os filtros selecionados.",
        variant: "destructive",
      })
      return
    }

    let content: string
    let mimeType: string
    let extension: string

    switch (selectedFormat) {
      case "tmx":
        content = generateTMX(filteredData)
        mimeType = "application/xml"
        extension = "tmx"
        break
      case "csv":
        content = generateCSV(filteredData)
        mimeType = "text/csv"
        extension = "csv"
        break
      case "json":
        content = generateJSON(filteredData)
        mimeType = "application/json"
        extension = "json"
        break
      case "txt":
        content = generateTXT(filteredData)
        mimeType = "text/plain"
        extension = "txt"
        break
      default:
        return
    }

    const filename = `${fileName}.${extension}`
    downloadFile(content, filename, mimeType)

    toast({
      title: "Exportação Concluída",
      description: `${filteredData.length} pares exportados como ${filename}`,
    })
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        let importedData: TranslationPair[] = []

        if (file.name.endsWith(".json")) {
          const parsed = JSON.parse(content)
          importedData = parsed.translationPairs || parsed
        } else if (file.name.endsWith(".csv")) {
          const lines = content.split("\n")
          const hasHeaders = lines[0].includes("Português") || lines[0].includes("Portuguese")
          const dataLines = hasHeaders ? lines.slice(1) : lines

          importedData = dataLines
            .filter((line) => line.trim())
            .map((line, index) => {
              const columns = line.split(",").map((col) => col.replace(/^"|"$/g, "").replace(/""/g, '"'))
              return {
                id: Date.now().toString() + index,
                portuguese: columns[hasHeaders ? 1 : 0] || "",
                english: columns[hasHeaders ? 2 : 1] || "",
                category: hasHeaders && columns[3] ? columns[3] : "Importado",
              }
            })
        }

        if (importedData.length > 0) {
          const existingMemory = JSON.parse(localStorage.getItem("translationMemory") || "[]")
          const updatedMemory = [...existingMemory, ...importedData]
          localStorage.setItem("translationMemory", JSON.stringify(updatedMemory))
          setTranslationMemory(updatedMemory)

          toast({
            title: "Importação Concluída",
            description: `${importedData.length} pares importados com sucesso!`,
          })
        }
      } catch (error) {
        toast({
          title: "Erro na Importação",
          description: "Formato de arquivo não suportado ou arquivo corrompido.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
    event.target.value = "" // Reset input
  }

  const formatDescriptions = {
    tmx: "Translation Memory eXchange - Padrão da indústria para CAT tools",
    csv: "Comma Separated Values - Compatível com Excel e planilhas",
    json: "JavaScript Object Notation - Formato estruturado com metadados",
    txt: "Texto simples - Formato legível para revisão manual",
  }

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Memória de Tradução
          </CardTitle>
          <CardDescription>
            Exporte sua memória de tradução em formatos profissionais compatíveis com ferramentas CAT
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-1">{translationMemory.length}</div>
              <div className="text-sm text-muted-foreground">Total de Pares</div>
            </div>
            <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-1">{getFilteredMemory().length}</div>
              <div className="text-sm text-muted-foreground">Para Exportar</div>
            </div>
            <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 mb-1">{categories.length}</div>
              <div className="text-sm text-muted-foreground">Categorias</div>
            </div>
          </div>

          <Separator />

          {/* Export Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="format">Formato de Exportação</Label>
                <Select value={selectedFormat} onValueChange={(value: ExportFormat) => setSelectedFormat(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tmx">TMX (Translation Memory)</SelectItem>
                    <SelectItem value="csv">CSV (Excel/Planilhas)</SelectItem>
                    <SelectItem value="json">JSON (Estruturado)</SelectItem>
                    <SelectItem value="txt">TXT (Texto Simples)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{formatDescriptions[selectedFormat]}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filename">Nome do Arquivo</Label>
                <Input
                  id="filename"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="memoria-traducao"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="metadata"
                  checked={includeMetadata}
                  onCheckedChange={(checked) => setIncludeMetadata(checked as boolean)}
                />
                <Label htmlFor="metadata" className="text-sm">
                  Incluir metadados (IDs, categorias)
                </Label>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Filtrar por Categorias</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma categoria disponível</p>
                  ) : (
                    categories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category}`}
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCategories([...selectedCategories, category])
                            } else {
                              setSelectedCategories(selectedCategories.filter((c) => c !== category))
                            }
                          }}
                        />
                        <Label htmlFor={`category-${category}`} className="text-sm">
                          {category}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
                {categories.length > 0 && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedCategories(categories)}
                      className="flex-1"
                    >
                      Selecionar Todas
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSelectedCategories([])} className="flex-1">
                      Limpar Seleção
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button onClick={handleExport} className="w-full" size="lg" disabled={translationMemory.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar {getFilteredMemory().length} Pares como {selectedFormat.toUpperCase()}
          </Button>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Memória de Tradução
          </CardTitle>
          <CardDescription>Importe memórias de tradução de outros sistemas ou backups anteriores</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-sm font-medium">Selecione um arquivo para importar</p>
              <p className="text-xs text-muted-foreground">Formatos suportados: JSON, CSV</p>
            </div>
            <Input type="file" accept=".json,.csv" onChange={handleImport} className="mt-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">Formato TMX</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">SDL Trados Studio</Badge>
                <Badge variant="secondary">MemoQ</Badge>
                <Badge variant="secondary">Wordfast</Badge>
                <Badge variant="secondary">OmegaT</Badge>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">Formato CSV</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Microsoft Excel</Badge>
                <Badge variant="secondary">Google Sheets</Badge>
                <Badge variant="secondary">LibreOffice Calc</Badge>
                <Badge variant="secondary">Análise de dados</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Format Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Compatibilidade com Ferramentas CAT
          </CardTitle>
          <CardDescription>Formatos compatíveis com as principais ferramentas de tradução assistida</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">Formato TMX</h4>
              <div className="space-y-1">
                <Badge variant="secondary">SDL Trados Studio</Badge>
                <Badge variant="secondary">MemoQ</Badge>
                <Badge variant="secondary">Wordfast</Badge>
                <Badge variant="secondary">OmegaT</Badge>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">Formato CSV</h4>
              <div className="space-y-1">
                <Badge variant="secondary">Microsoft Excel</Badge>
                <Badge variant="secondary">Google Sheets</Badge>
                <Badge variant="secondary">LibreOffice Calc</Badge>
                <Badge variant="secondary">Análise de dados</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
