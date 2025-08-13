import { renderHook, act } from "@testing-library/react"
import { usePersistentState } from "@/hooks/use-persistent-state"

// Mock do localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    clear: jest.fn(() => {
      store = {}
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
  }
})()

// Mock do objeto global
Object.defineProperty(window, "localStorage", { value: mockLocalStorage })

describe("usePersistentState", () => {
  beforeEach(() => {
    mockLocalStorage.clear()
    jest.clearAllMocks()
  })

  it("should initialize with the provided value", () => {
    const { result } = renderHook(() => usePersistentState("test-key", "initial value"))
    expect(result.current[0]).toBe("initial value")
  })

  it("should load value from localStorage if available", () => {
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify("stored value"))
    const { result } = renderHook(() => usePersistentState("test-key", "initial value"))
    expect(result.current[0]).toBe("stored value")
  })

  it("should update localStorage when state changes", () => {
    const { result } = renderHook(() => usePersistentState("test-key", "initial value"))

    act(() => {
      result.current[1]("new value")
    })

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith("test-key", JSON.stringify("new value"))
    expect(result.current[0]).toBe("new value")
  })

  it("should handle localStorage errors gracefully", () => {
    // Simulate an error when getting from localStorage
    mockLocalStorage.getItem.mockImplementationOnce(() => {
      throw new Error("localStorage error")
    })

    const { result } = renderHook(() => usePersistentState("test-key", "initial value"))
    expect(result.current[0]).toBe("initial value")

    // Simulate an error when setting to localStorage
    mockLocalStorage.setItem.mockImplementationOnce(() => {
      throw new Error("localStorage error")
    })

    act(() => {
      result.current[1]("new value")
    })

    // Should still update the state even if localStorage fails
    expect(result.current[0]).toBe("new value")
  })
})
