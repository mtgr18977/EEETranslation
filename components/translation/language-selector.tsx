"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { SUPPORTED_LANGUAGES } from "@/utils/constants"

interface LanguageSelectorProps {
  value: string
  onChange: (value: string) => void
  label: string
  className?: string
}

export default function LanguageSelector({ value, onChange, label, className = "" }: LanguageSelectorProps) {
  return (
    <div className={`space-y-1 w-[180px] ${className}`}>
      <Label htmlFor={`language-${label}`}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={`language-${label}`} className="w-full">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
