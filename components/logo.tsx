interface LogoProps {
  width?: number
  height?: number
  className?: string
}

export default function Logo({ width = 200, height = 60, className = "" }: LogoProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background shape */}
      <rect x="10" y="10" width="180" height="40" rx="8" fill="#0D9488" />

      {/* Text bubble shapes */}
      <path
        d="M40 20C40 17.7909 41.7909 16 44 16H76C78.2091 16 80 17.7909 80 20V32C80 34.2091 78.2091 36 76 36H68L64 42L60 36H44C41.7909 36 40 34.2091 40 32V20Z"
        fill="white"
      />
      <path
        d="M120 28C120 25.7909 121.791 24 124 24H156C158.209 24 160 25.7909 160 28V40C160 42.2091 158.209 44 156 44H140L136 50L132 44H124C121.791 44 120 42.2091 120 40V28Z"
        fill="white"
      />

      {/* Connection line */}
      <path d="M80 26H120" stroke="white" strokeWidth="2" strokeDasharray="4 2" />

      {/* Text elements */}
      <text x="50" y="30" fontFamily="Arial" fontSize="12" fontWeight="bold" fill="#0D9488">
        Source
      </text>
      <text x="130" y="38" fontFamily="Arial" fontSize="12" fontWeight="bold" fill="#0D9488">
        Target
      </text>

      {/* Translation arrows */}
      <path d="M100 22L104 18M100 22L96 18" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M100 30L104 34M100 30L96 34" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
