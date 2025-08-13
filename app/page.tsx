"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, Search, Download, Languages, Zap } from "lucide-react"
import { TextUploadForm } from "@/components/text-upload-form"
import { TranslationMemorySearch } from "@/components/translation-memory-search"
import { TranslationMemoryList } from "@/components/translation-memory-list"
import { TextProcessor } from "@/components/text-processor"
import { ExportManager } from "@/components/export-manager"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("upload")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Languages className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Tradutor</h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Crie e gerencie memórias de tradução para otimizar seu trabalho de tradução entre português e inglês
          </p>
        </div>

        {/* Main Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="process" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Processar
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Buscar
            </TabsTrigger>
            <TabsTrigger value="memory" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Memória
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <TextUploadForm />
          </TabsContent>

          <TabsContent value="process">
            <TextProcessor />
          </TabsContent>

          <TabsContent value="search">
            <TranslationMemorySearch />
          </TabsContent>

          <TabsContent value="memory">
            <TranslationMemoryList />
          </TabsContent>

          {/* Replaced placeholder with full export functionality */}
          <TabsContent value="export">
            <ExportManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
