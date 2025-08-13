"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Trash2,
  BarChart3,
  TrendingUp,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface TranslationPair {
  id: string
  portuguese: string
  english: string
  category?: string
  createdAt?: string
  lastModified?: string
  quality?: number
}

interface QualityMetrics {
  averageLength: number
  shortSegments: number
  longSegments: number
  duplicates: number
  emptyFields: number
  qualityScore: number
}

export function TranslationMemoryList() {
  const [translationMemory, setTranslationMemory] = useState<TranslationPair[]>([])
  const [filteredMemory, setFilteredMemory] = useState<TranslationPair[]>([])
  const [selectedPairs, setSelectedPairs] = useState<string[]>([])
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [activeTab, setActiveTab] = useState("overview")
  const { toast } = useToast()

  useEffect(() => {
    loadMemory()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [translationMemory, filterCategory, searchTerm, sortBy])

  const loadMemory = () => {
    const memory = JSON.parse(localStorage.getItem("translationMemory") || "[]")
    // Add timestamps if missing
    const memoryWithTimestamps = memory.map((pair: TranslationPair) => ({
      ...pair,
      createdAt: pair.createdAt || new Date().toISOString(),
      lastModified: pair.lastModified || new Date().toISOString(),
      quality: pair.quality || calculateQuality(pair),
    }))
    setTranslationMemory(memoryWithTimestamps)
  }

  const calculateQuality = (pair: TranslationPair): number => {
    let score = 100

    // Penalize very short or very long segments
    const ptLength = pair.portuguese.length
    const enLength = pair.english.length

    if (ptLength < 10 || enLength < 10) score -= 20
    if (ptLength > 500 || enLength > 500) score -= 10

    // Penalize extreme length differences
    const lengthRatio = Math.max(ptLength, enLength) / Math.min(ptLength, enLength)
    if (lengthRatio > 3) score -= 15

    // Check for empty fields
    if (!pair.portuguese.trim() || !pair.english.trim()) score -= 50

    return Math.max(0, Math.min(100, score))
  }

  const applyFilters = () => {
    let filtered = [...translationMemory]

    // Category filter
    if (filterCategory !== "all") {
      filtered = filtered.filter((pair) => pair.category === filterCategory)
    }

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (pair) =>
          pair.portuguese.toLowerCase().includes(search) ||
          pair.english.toLowerCase().includes(search) ||
          (pair.category && pair.category.toLowerCase().includes(search)),
      )
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        case "oldest":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        case "quality-high":
          return (b.quality || 0) - (a.quality || 0)
        case "quality-low":
          return (a.quality || 0) - (b.quality || 0)
        case "length-long":
          return b.portuguese.length + b.english.length - (a.portuguese.length + a.english.length)
        case "length-short":
          return a.portuguese.length + a.english.length - (b.portuguese.length + b.english.length)
        default:
          return 0
      }
    })

    setFilteredMemory(filtered)
  }

  const qualityMetrics = useMemo((): QualityMetrics => {
    if (translationMemory.length === 0) {
      return {
        averageLength: 0,
        shortSegments: 0,
        longSegments: 0,
        duplicates: 0,
        emptyFields: 0,
        qualityScore: 0,
      }
    }

    const totalLength = translationMemory.reduce((sum, pair) => sum + pair.portuguese.length + pair.english.length, 0)

    const shortSegments = translationMemory.filter(
      (pair) => pair.portuguese.length < 20 || pair.english.length < 20,
    ).length

    const longSegments = translationMemory.filter(
      (pair) => pair.portuguese.length > 300 || pair.english.length > 300,
    ).length

    const emptyFields = translationMemory.filter((pair) => !pair.portuguese.trim() || !pair.english.trim()).length

    // Simple duplicate detection
    const ptTexts = new Set()
    const enTexts = new Set()
    let duplicates = 0

    translationMemory.forEach((pair) => {
      if (ptTexts.has(pair.portuguese) || enTexts.has(pair.english)) {
        duplicates++
      }
      ptTexts.add(pair.portuguese)
      enTexts.add(pair.english)
    })

    const averageQuality =
      translationMemory.reduce((sum, pair) => sum + (pair.quality || 0), 0) / translationMemory.length

    return {
      averageLength: Math.round(totalLength / (translationMemory.length * 2)),
      shortSegments,
      longSegments,
      duplicates,
      emptyFields,
      qualityScore: Math.round(averageQuality),
    }
  }, [translationMemory])

  const categories = Array.from(new Set(translationMemory.map((pair) => pair.category).filter(Boolean)))

  const deletePair = (id: string) => {
    const updatedMemory = translationMemory.filter((pair) => pair.id !== id)
    localStorage.setItem("translationMemory", JSON.stringify(updatedMemory))
    setTranslationMemory(updatedMemory)
    setSelectedPairs((prev) => prev.filter((selectedId) => selectedId !== id))

    toast({
      title: "Sucesso",
      description: "Par de tradução removido da memória.",
    })
  }

  const deleteSelected = () => {
    if (selectedPairs.length === 0) return

    const updatedMemory = translationMemory.filter((pair) => !selectedPairs.includes(pair.id))
    localStorage.setItem("translationMemory", JSON.stringify(updatedMemory))
    setTranslationMemory(updatedMemory)
    setSelectedPairs([])

    toast({
      title: "Sucesso",
      description: `${selectedPairs.length} pares removidos da memória.`,
    })
  }

  const clearAllMemory = () => {
    localStorage.removeItem("translationMemory")
    setTranslationMemory([])
    setSelectedPairs([])

    toast({
      title: "Sucesso",
      description: "Toda a memória de tradução foi limpa.",
    })
  }

  const toggleSelectAll = () => {
    if (selectedPairs.length === filteredMemory.length) {
      setSelectedPairs([])
    } else {
      setSelectedPairs(filteredMemory.map((pair) => pair.id))
    }
  }

  const toggleSelectPair = (id: string) => {
    setSelectedPairs((prev) => (prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]))
  }

  const exportSelected = () => {
    if (selectedPairs.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um par para exportar.",
        variant: "destructive",
      })
      return
    }

    const selectedData = translationMemory.filter((pair) => selectedPairs.includes(pair.id))
    const csvContent =
      "Português,Inglês,Categoria\n" +
      selectedData.map((pair) => `"${pair.portuguese}","${pair.english}","${pair.category || ""}"`).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `traducoes-selecionadas-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Exportação Concluída",
      description: `${selectedPairs.length} pares exportados.`,
    })
  }

  const getQualityColor = (quality: number) => {
    if (quality >= 80) return "text-green-600"
    if (quality >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getQualityBadge = (quality: number) => {
    if (quality >= 80) return <Badge className="bg-green-100 text-green-800">Alta</Badge>
    if (quality >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Média</Badge>
    return <Badge className="bg-red-100 text-red-800">Baixa</Badge>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Dashboard de Gerenciamento
          </CardTitle>
          <CardDescription>Gerencie e analise sua memória de tradução com ferramentas avançadas</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="analytics">Análises</TabsTrigger>
              <TabsTrigger value="quality">Qualidade</TabsTrigger>
              <TabsTrigger value="management">Gerenciamento</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Main Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{translationMemory.length}</div>
                  <div className="text-sm text-muted-foreground">Total de Pares</div>
                </div>
                <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 mb-1">{categories.length}</div>
                  <div className="text-sm text-muted-foreground">Categorias</div>
                </div>
                <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600 mb-1">{qualityMetrics.averageLength}</div>
                  <div className="text-sm text-muted-foreground">Chars Médios</div>
                </div>
                <div className="text-center p-6 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className={`text-3xl font-bold mb-1 ${getQualityColor(qualityMetrics.qualityScore)}`}>
                    {qualityMetrics.qualityScore}%
                  </div>
                  <div className="text-sm text-muted-foreground">Qualidade Média</div>
                </div>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Atividade Recente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {translationMemory
                      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                      .slice(0, 5)
                      .map((pair, index) => (
                        <div
                          key={pair.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium truncate">{pair.portuguese}</p>
                            <p className="text-xs text-muted-foreground">
                              {pair.category && (
                                <Badge variant="outline" className="mr-2">
                                  {pair.category}
                                </Badge>
                              )}
                              {new Date(pair.createdAt || 0).toLocaleDateString()}
                            </p>
                          </div>
                          {getQualityBadge(pair.quality || 0)}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {/* Category Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Distribuição por Categoria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categories.map((category) => {
                      const count = translationMemory.filter((pair) => pair.category === category).length
                      const percentage = (count / translationMemory.length) * 100

                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{category}</span>
                            <span>
                              {count} pares ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Growth Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Crescimento da Memória
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-lg font-bold">
                        {
                          translationMemory.filter((pair) => {
                            const created = new Date(pair.createdAt || 0)
                            const today = new Date()
                            return created.toDateString() === today.toDateString()
                          }).length
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">Hoje</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-lg font-bold">
                        {
                          translationMemory.filter((pair) => {
                            const created = new Date(pair.createdAt || 0)
                            const weekAgo = new Date()
                            weekAgo.setDate(weekAgo.getDate() - 7)
                            return created >= weekAgo
                          }).length
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">Esta Semana</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-lg font-bold">
                        {
                          translationMemory.filter((pair) => {
                            const created = new Date(pair.createdAt || 0)
                            const monthAgo = new Date()
                            monthAgo.setMonth(monthAgo.getMonth() - 1)
                            return created >= monthAgo
                          }).length
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">Este Mês</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quality" className="space-y-6">
              {/* Quality Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Métricas de Qualidade
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Segmentos Curtos (&lt;20 chars)</span>
                      <Badge variant="outline">{qualityMetrics.shortSegments}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Segmentos Longos (&gt;300 chars)</span>
                      <Badge variant="outline">{qualityMetrics.longSegments}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Possíveis Duplicatas</span>
                      <Badge variant="outline">{qualityMetrics.duplicates}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Campos Vazios</span>
                      <Badge variant="outline">{qualityMetrics.emptyFields}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Problemas Detectados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {qualityMetrics.emptyFields > 0 && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <p className="text-sm font-medium text-red-800 dark:text-red-200">
                            {qualityMetrics.emptyFields} pares com campos vazios
                          </p>
                        </div>
                      )}
                      {qualityMetrics.duplicates > 0 && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            {qualityMetrics.duplicates} possíveis duplicatas encontradas
                          </p>
                        </div>
                      )}
                      {qualityMetrics.shortSegments > 0 && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            {qualityMetrics.shortSegments} segmentos muito curtos
                          </p>
                        </div>
                      )}
                      {qualityMetrics.emptyFields === 0 &&
                        qualityMetrics.duplicates === 0 &&
                        qualityMetrics.shortSegments === 0 && (
                          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                              Nenhum problema crítico detectado
                            </p>
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="management" className="space-y-6">
              {/* Filters and Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filtros e Controles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Buscar</Label>
                      <Input
                        placeholder="Buscar em traduções..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as categorias</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Ordenar por</Label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Mais Recentes</SelectItem>
                          <SelectItem value="oldest">Mais Antigos</SelectItem>
                          <SelectItem value="quality-high">Maior Qualidade</SelectItem>
                          <SelectItem value="quality-low">Menor Qualidade</SelectItem>
                          <SelectItem value="length-long">Mais Longos</SelectItem>
                          <SelectItem value="length-short">Mais Curtos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Bulk Actions */}
                  <Separator />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={toggleSelectAll}>
                      {selectedPairs.length === filteredMemory.length ? "Desmarcar Todos" : "Selecionar Todos"}
                    </Button>
                    <Button variant="outline" onClick={exportSelected} disabled={selectedPairs.length === 0}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar Selecionados ({selectedPairs.length})
                    </Button>
                    <Button variant="destructive" onClick={deleteSelected} disabled={selectedPairs.length === 0}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Selecionados ({selectedPairs.length})
                    </Button>
                    <Button variant="outline" onClick={loadMemory}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Atualizar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Translation Pairs List */}
              <Card>
                <CardHeader>
                  <CardTitle>Pares de Tradução ({filteredMemory.length})</CardTitle>
                  {selectedPairs.length > 0 && (
                    <CardDescription>{selectedPairs.length} pares selecionados</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {filteredMemory.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {translationMemory.length === 0
                          ? "Nenhuma tradução salva ainda. Vá para a aba 'Upload' para adicionar traduções."
                          : "Nenhum resultado encontrado para os filtros aplicados."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredMemory.map((pair, index) => (
                        <div key={pair.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={selectedPairs.includes(pair.id)}
                                onCheckedChange={() => toggleSelectPair(pair.id)}
                              />
                              <span className="text-sm font-medium text-muted-foreground">Par #{index + 1}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {pair.category && <Badge variant="secondary">{pair.category}</Badge>}
                              {getQualityBadge(pair.quality || 0)}
                              <Button variant="ghost" size="sm" onClick={() => deletePair(pair.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                PORTUGUÊS ({pair.portuguese.length} chars)
                              </div>
                              <p className="text-sm">{pair.portuguese}</p>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                INGLÊS ({pair.english.length} chars)
                              </div>
                              <p className="text-sm">{pair.english}</p>
                            </div>
                          </div>
                          {pair.createdAt && (
                            <div className="text-xs text-muted-foreground">
                              Criado em: {new Date(pair.createdAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-red-200 dark:border-red-800">
                <CardHeader>
                  <CardTitle className="text-red-600 dark:text-red-400">Zona de Perigo</CardTitle>
                  <CardDescription>Ações irreversíveis que afetam toda a memória de tradução</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive" onClick={clearAllMemory} disabled={translationMemory.length === 0}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Toda a Memória ({translationMemory.length} pares)
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
