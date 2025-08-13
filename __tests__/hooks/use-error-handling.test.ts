import { renderHook, act } from "@testing-library/react"
import { useErrorHandling } from "@/hooks/use-error-handling"
import { ErrorService } from "@/utils/error-service"

// Mock do useToast
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

// Mock do ErrorService
jest.mock("@/utils/error-service", () => ({
  ErrorService: {
    createError: jest.fn((type, message, details) => ({
      type,
      message: message || "Error message",
      details,
      timestamp: Date.now(),
    })),
    logError: jest.fn(),
  },
}))

describe("useErrorHandling", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should initialize with null error and loading false", () => {
    const { result } = renderHook(() => useErrorHandling())
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it("should handle errors correctly", () => {
    const { result } = renderHook(() => useErrorHandling())
    const testError = new Error("Test error")

    act(() => {
      result.current.handleError(testError)
    })

    expect(ErrorService.createError).toHaveBeenCalled()
    expect(ErrorService.logError).toHaveBeenCalled()
    expect(result.current.error).not.toBeNull()
  })

  it("should clear errors", () => {
    const { result } = renderHook(() => useErrorHandling())

    act(() => {
      result.current.handleError(new Error("Test error"))
    })

    expect(result.current.error).not.toBeNull()

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })

  it("should handle async functions with error handling", async () => {
    const { result } = renderHook(() => useErrorHandling())

    // Test successful function
    const successFn = jest.fn().mockResolvedValue("success")

    let returnValue
    await act(async () => {
      returnValue = await result.current.withErrorHandling(successFn)
    })

    expect(returnValue).toBe("success")
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()

    // Test function with error
    const errorFn = jest.fn().mockRejectedValue(new Error("Test error"))

    await act(async () => {
      returnValue = await result.current.withErrorHandling(errorFn)
    })

    expect(returnValue).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).not.toBeNull()
    expect(ErrorService.logError).toHaveBeenCalled()
  })
})
