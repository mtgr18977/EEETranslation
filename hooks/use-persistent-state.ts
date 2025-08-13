"use client"

import { useState, useEffect } from "react"

export function usePersistentState<T>(
  key: string,
  initialValue: T,
  storage: Storage = typeof window !== "undefined" ? localStorage : null,
): [T, (value: T | ((val: T) => T)) => void] {
  // Criar estado com valor inicial
  const [state, setState] = useState<T>(initialValue)

  // Carregar valor do localStorage na montagem do componente
  useEffect(() => {
    if (!storage) return

    try {
      const item = storage.getItem(key)
      if (item) {
        setState(JSON.parse(item))
      }
    } catch (error) {
      console.error(`Erro ao carregar estado persistente para ${key}:`, error)
    }
  }, [key, storage])

  // Atualizar localStorage quando o estado mudar
  useEffect(() => {
    if (!storage) return

    try {
      storage.setItem(key, JSON.stringify(state))
    } catch (error) {
      console.error(`Erro ao salvar estado persistente para ${key}:`, error)
    }
  }, [key, state, storage])

  return [state, setState]
}
