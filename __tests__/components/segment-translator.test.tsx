import { render, screen } from "@testing-library/react"
import SegmentTranslator from "@/components/translation/segment-translator"
import { KeyboardShortcutsProvider } from "@/contexts/keyboard-shortcuts-context"

// Mock dos hooks e componentes necessários
jest.mock("@/hooks/use-segmented-translator", () => ({
  useSegmentedTranslator: () => ({
    segments: [],
    isProcessing: false,
    isBatchTranslating: false,
    translationProgress: 0,
    activeSegmentId: null,
    showQualityReport: false,
    saveSuccess: false,
    translationError: null,
    failedSegments: [],
    translationDetails: null,
    untranslatedCount: 0,
    totalSegments: 0,
    translatedPercent: 0,
    handleUpdateSegment: jest.fn(),
    handleSaveTranslation: jest.fn(),
    handleTranslateAll: jest.fn(),
    handleExportReport: jest.fn(),
    setActiveSegmentId: jest.fn(),
  }),
}))

jest.mock("@/components/translation/optimized-segment-list", () => {
  return {
    __esModule: true,
    default: () => <div data-testid="optimized-segment-list">Optimized Segment List</div>,
  }
})

jest.mock("@/components/alignment-legend", () => {
  return {
    __esModule: true,
    default: () => <div data-testid="alignment-legend">Alignment Legend</div>,
  }
})

describe("SegmentedTranslator", () => {
  const defaultProps = {
    sourceText: "Hello world",
    targetText: "",
    onUpdateTargetText: jest.fn(),
    sourceLang: "en",
    targetLang: "pt",
    glossaryTerms: [],
    apiSettings: { libreApiUrl: "https://test.com" },
  }

  it("renders loading state when processing", () => {
    jest.spyOn(require("@/hooks/use-segmented-translator"), "useSegmentedTranslator").mockReturnValue({
      ...require("@/hooks/use-segmented-translator").useSegmentedTranslator(),
      isProcessing: true,
    })

    render(
      <KeyboardShortcutsProvider>
        <SegmentTranslator {...defaultProps} />
      </KeyboardShortcutsProvider>,
    )

    expect(screen.getByText(/Processing segments/i)).toBeInTheDocument()
  })

  it("renders empty state when no source text", () => {
    render(
      <KeyboardShortcutsProvider>
        <SegmentTranslator {...defaultProps} sourceText="" />
      </KeyboardShortcutsProvider>,
    )

    expect(screen.getByText(/Enter or upload source text/i)).toBeInTheDocument()
  })

  it("renders normal state with controls", () => {
    render(
      <KeyboardShortcutsProvider>
        <SegmentTranslator {...defaultProps} />
      </KeyboardShortcutsProvider>,
    )

    expect(screen.getByTestId("alignment-legend")).toBeInTheDocument()
    expect(screen.getByText(/Shortcuts/i)).toBeInTheDocument()
    expect(screen.getByText(/segments translated/i)).toBeInTheDocument()
    expect(screen.getByText(/Translate All/i)).toBeInTheDocument()
    expect(screen.getByTestId("optimized-segment-list")).toBeInTheDocument()
    expect(screen.getByText(/Pronto/i)).toBeInTheDocument()
  })

  it("shows translation error when present", () => {
    jest.spyOn(require("@/hooks/use-segmented-translator"), "useSegmentedTranslator").mockReturnValue({
      ...require("@/hooks/use-segmented-translator").useSegmentedTranslator(),
      translationError: "Test error message",
    })

    render(
      <KeyboardShortcutsProvider>
        <SegmentTranslator {...defaultProps} />
      </KeyboardShortcutsProvider>,
    )

    expect(screen.getByText("Test error message")).toBeInTheDocument()
  })

  it("shows success message when save is successful", () => {
    jest.spyOn(require("@/hooks/use-segmented-translator"), "useSegmentedTranslator").mockReturnValue({
      ...require("@/hooks/use-segmented-translator").useSegmentedTranslator(),
      saveSuccess: true,
    })

    render(
      <KeyboardShortcutsProvider>
        <SegmentTranslator {...defaultProps} />
      </KeyboardShortcutsProvider>,
    )

    expect(screen.getByText(/Tradução salva com sucesso/i)).toBeInTheDocument()
  })
})
