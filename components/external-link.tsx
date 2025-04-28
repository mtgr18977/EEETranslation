import type React from "react"
import { ExternalLinkIcon } from "lucide-react"

interface ExternalLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export default function ExternalLink({ href, children, className = "" }: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-blue-600 hover:underline flex items-center ${className}`}
    >
      {children}
      <ExternalLinkIcon className="h-3 w-3 ml-1" />
    </a>
  )
}
