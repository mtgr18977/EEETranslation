"use client"

import { useState } from "react"
import Navbar from "@/components/navbar"
import SourceText from "@/components/source-text"
import TargetText from "@/components/target-text"
import InfoPanel from "@/components/info-panel"
import GlossaryModal from "@/components/glossary-modal"
import { TranslationMemoryModal } from "@/components/translation-memory-modal"
import TranslationSuggestions from "@/components/translation-suggestions"
import LanguageSelector from "@/components/language-selector"

export default function TranslationPlatform() {
  const [sourceText, setSourceText] = useState<string>("")
  const [targetText, setTargetText] = useState<string>("")
  const [showGlossary, setShowGlossary] = useState<boolean>(false)
  const [showTM, setShowTM] = useState<boolean>(false)
  const [sourceLang, setSourceLang] = useState<string>("en")
  const [targetLang, setTargetLang] = useState<string>("pt")

  const handleFileUpload = (content: string) => {
    setSourceText(content)
    // Reset target text when new source is uploaded
    setTargetText("")
  }

  const handleDownload = () => {
    if (!targetText) return

    const element = document.createElement("a")
    const file = new Blob([targetText], { type: "text/markdown" })
    element.href = URL.createObjectURL(file)
    element.download = "translated_text.md"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleApplySuggestion = (suggestion: string) => {
    setTargetText(suggestion)
  }

  return (
    <main className="flex flex-col h-screen">
      <Navbar
        onUpload={handleFileUpload}
        onDownload={handleDownload}
        onOpenTM={() => setShowTM(true)}
        onOpenGlossary={() => setShowGlossary(true)}
      />

      <div className="flex flex-1 p-4 gap-4 overflow-hidden">
        <div className="flex flex-col flex-1">
          <SourceText text={sourceText} onChange={setSourceText} />
          <div className="mt-2">
            <LanguageSelector value={sourceLang} onChange={setSourceLang} label="Source Language" />
          </div>
        </div>

        <div className="flex flex-col flex-1">
          <TargetText text={targetText} onChange={setTargetText} />
          <div className="mt-2">
            <LanguageSelector value={targetLang} onChange={setTargetLang} label="Target Language" />
          </div>
          <TranslationSuggestions
            sourceText={sourceText}
            onApplySuggestion={handleApplySuggestion}
            sourceLang={sourceLang}
            targetLang={targetLang}
          />
        </div>

        <InfoPanel sourceText={sourceText} targetText={targetText} sourceLang={sourceLang} targetLang={targetLang} />
      </div>

      {showGlossary && <GlossaryModal isOpen={showGlossary} onClose={() => setShowGlossary(false)} />}

      {showTM && (
        <TranslationMemoryModal
          isOpen={showTM}
          onClose={() => setShowTM(false)}
          onApply={(segments) => {
            // Logic to apply TM segments to the target text
            console.log("Applying TM segments", segments)
          }}
        />
      )}
    </main>
  )
}
