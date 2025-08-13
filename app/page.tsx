"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, Search, Download, Languages, Zap, Sparkles } from "lucide-react"
import { TextUploadForm } from "@/components/text-upload-form"
import { TranslationMemorySearch } from "@/components/translation-memory-search"
import { TranslationMemoryList } from "@/components/translation-memory-list"
import { TextProcessor } from "@/components/text-processor"
import { ExportManager } from "@/components/export-manager"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("upload")

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="relative">
              <Languages className="h-12 w-12 text-primary" />
              <Sparkles className="h-4 w-4 text-accent absolute -top-1 -right-1" />
            </div>
            <h1
              className="text-6xl font-black text-foreground tracking-tight"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              Tradutor
            </h1>
          </div>
          <div className="space-y-4">
            <h2
              className="text-2xl font-semibold text-foreground/90 max-w-3xl mx-auto leading-relaxed"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              Eleve Suas Traduções
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Crie e gerencie memórias de tradução profissionais para otimizar seu trabalho entre português e inglês com
              confiança
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-12">
            <TabsList className="grid grid-cols-5 bg-card/50 backdrop-blur-sm border border-border/50 p-2 rounded-xl shadow-lg">
              <TabsTrigger
                value="upload"
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Upload</span>
              </TabsTrigger>
              <TabsTrigger
                value="process"
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
              >
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Processar</span>
              </TabsTrigger>
              <TabsTrigger
                value="search"
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Buscar</span>
              </TabsTrigger>
              <TabsTrigger
                value="memory"
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Memória</span>
              </TabsTrigger>
              <TabsTrigger
                value="export"
                className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="space-y-8">
            <TabsContent value="upload" className="mt-0">
              <div className="card-hover">
                <TextUploadForm />
              </div>
            </TabsContent>

            <TabsContent value="process" className="mt-0">
              <div className="card-hover">
                <TextProcessor />
              </div>
            </TabsContent>

            <TabsContent value="search" className="mt-0">
              <div className="card-hover">
                <TranslationMemorySearch />
              </div>
            </TabsContent>

            <TabsContent value="memory" className="mt-0">
              <div className="card-hover">
                <TranslationMemoryList />
              </div>
            </TabsContent>

            <TabsContent value="export" className="mt-0">
              <div className="card-hover">
                <ExportManager />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
