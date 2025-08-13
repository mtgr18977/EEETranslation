"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Lightbulb } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface TranslationPair {
  id: string
  portuguese: string
  english: string
  category?: string
}

interface SuggestionMatch {
  pair: TranslationPair
  similarity: number
  matchType: "exact" | "partial" | "fuzzy"
}

export function TranslationMemorySearch() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [translationMemory, setTranslationMemory] = useState<TranslationPair[]>([])
  const [filteredResults, setFilteredResults] = useState<TranslationPair[]>([])
  const [suggestions, setSuggestions] = useState<SuggestionMatch[]>([])
  const { toast } = useToast()

  const calculateFuzzyMatch = (searchText: string, targetText: string): number => {
    const search = searchText.toLowerCase().trim()
    const target = targetText.toLowerCase().trim()

    // Exact match
    if (target.includes(search)) {
      return search.length / target.length
    }

    // Word-based matching
    const searchWords = search.split(/\s+/)
    const targetWords = target.split(/\s+/)

    let matchingWords = 0
    searchWords.forEach((searchWord) => {
      if (targetWords.some((targetWord) => targetWord.includes(searchWord) || searchWord.includes(targetWord))) {
        matchingWords++
      }
    })

    return matchingWords / Math.max(searchWords.length, targetWords.length)
  }

  const findSuggestions = (query: string) => {
    if (!query.trim() || translationMemory.length === 0) {
      setSuggestions([])
      return
    }

    const matches: SuggestionMatch[] = []

    translationMemory.forEach((pair) => {
      const ptMatch = calculateFuzzyMatch(query, pair.portuguese)
      const enMatch = calculateFuzzyMatch(query, pair.english)
      const bestMatch = Math.max(ptMatch, enMatch)

      if (bestMatch > 0.3) {
        // Threshold for suggestions
        let matchType: SuggestionMatch["matchType"] = "fuzzy"
        if (bestMatch > 0.8) matchType = "exact"
        else if (bestMatch > 0.6) matchType = "partial"

        matches.push({
          pair,
          similarity: bestMatch,
          matchType,
        })
      }
    })

    // Sort by similarity and limit to top 5
    matches.sort((a, b) => b.similarity - a.similarity)
    setSuggestions(matches.slice(0, 5))
  }

  const categories = Array.from(new Set(translationMemory.map((pair) => pair.category).filter(Boolean)))

  const getMatchTypeColor = (matchType: SuggestionMatch["matchType"]) => {
    switch (matchType) {
      case "exact":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "partial":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "fuzzy":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  // Renamed function to avoid hook naming convention and moved toast usage inline
  const applySuggestion = (suggestion: SuggestionMatch) => {
    setSearchTerm(suggestion.pair.portuguese)
    toast({
      title: "Sugestão Aplicada",
      description: "Termo de busca atualizado com a sugestão selecionada.",
    })
  }

  useEffect(() => {
    // Carregar memória de tradução do localStorage
    const memory = JSON.parse(localStorage.getItem("translationMemory") || "[]")
    setTranslationMemory(memory)
    setFilteredResults(memory)
  }, [])

  useEffect(() => {
    // Filtrar resultados baseado na busca e categoria
    let filtered = translationMemory

    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (pair) =>
          pair.portuguese.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pair.english.toLowerCase().includes(searchTerm.toLowerCase()),
      )

      findSuggestions(searchTerm)
    } else {
      setSuggestions([])
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((pair) => pair.category === selectedCategory)
    }

    setFilteredResults(filtered)
  }, [searchTerm, selectedCategory, translationMemory])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar na Memória de Tradução
          </CardTitle>
          <CardDescription>Encontre traduções existentes na sua memória com busca inteligente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar texto</Label>
              <Input
                id="search"
                placeholder="Digite em português ou inglês..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-filter">Filtrar por categoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category!}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Sugestões Inteligentes
            </CardTitle>
            <CardDescription>Traduções similares encontradas na sua memória</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div key={suggestion.pair.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getMatchTypeColor(suggestion.matchType)}>
                        {suggestion.matchType === "exact"
                          ? "Exata"
                          : suggestion.matchType === "partial"
                            ? "Parcial"
                            : "Similar"}
                      </Badge>
                      <Badge variant="outline">{Math.round(suggestion.similarity * 100)}% similar</Badge>
                    </div>
                    {/* Updated function name to fix lint error */}
                    <Button size="sm" variant="outline" onClick={() => applySuggestion(suggestion)}>
                      Usar Sugestão
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">PORTUGUÊS</Label>
                      <p className="text-sm">{suggestion.pair.portuguese}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">INGLÊS</Label>
                      <p className="text-sm">{suggestion.pair.english}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados da Busca ({filteredResults.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredResults.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {translationMemory.length === 0
                  ? "Nenhuma tradução encontrada na memória. Adicione algumas traduções primeiro."
                  : "Nenhum resultado encontrado para sua busca."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResults.map((pair, index) => (
                <div key={pair.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Resultado #{index + 1}</span>
                    {pair.category && <Badge variant="secondary">{pair.category}</Badge>}
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
