"use client"

import { useState, useCallback } from "react"
import { ErrorService, type AppError } from "@/utils/error-service"
import { useToast } from "@/hooks/use-toast"

export function useErrorHandling() {
  const [error, setError] = useState<AppError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleError = useCallback(
    (err: any, showToast = true) => {
      const appError =
        err instanceof Error
          ? ErrorService.createError("unknown", err.message, { stack: err.stack })
          : (err as AppError)

      setError(appError)
      ErrorService.logError(appError)

      if (showToast) {
        toast({
          title: "Erro",
          description: appError.message,
          variant: "destructive",
        })
      }

      return appError
    },
    [toast],
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const withErrorHandling = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      options: { showToast?: boolean; loadingState?: boolean } = {},
    ): Promise<T | null> => {
      const { showToast = true, loadingState = true } = options

      try {
        if (loadingState) setIsLoading(true)
        clearError()
        return await fn()
      } catch (err) {
        handleError(err, showToast)
        return null
      } finally {
        if (loadingState) setIsLoading(false)
      }
    },
    [handleError, clearError],
  )

  return {
    error,
    isLoading,
    handleError,
    clearError,
    withErrorHandling,
  }
}
