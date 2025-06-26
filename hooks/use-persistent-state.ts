"use client"

import { useState, useEffect } from "react"

export function usePersistentState<T>(
  key: string,
  initialValue: T,
  storage?: Storage,
): [T, (value: T | ((val: T) => T)) => void] {
  const resolvedStorage: Storage | null =
    storage ?? (typeof window !== "undefined" ? window.localStorage : null)
  // Criar estado com valor inicial
  const [state, setState] = useState<T>(initialValue)

  // Carregar valor do localStorage na montagem do componente
  useEffect(() => {
    if (!resolvedStorage) return

    try {
      const item = resolvedStorage.getItem(key)
      if (item) {
        setState(JSON.parse(item))
      }
    } catch (error) {
      console.error(`Erro ao carregar estado persistente para ${key}:`, error)
    }
  }, [key, resolvedStorage])

  // Atualizar localStorage quando o estado mudar
  useEffect(() => {
    if (!resolvedStorage) return

    try {
      resolvedStorage.setItem(key, JSON.stringify(state))
    } catch (error) {
      console.error(`Erro ao salvar estado persistente para ${key}:`, error)
    }
  }, [key, state, resolvedStorage])

  return [state, setState]
}
