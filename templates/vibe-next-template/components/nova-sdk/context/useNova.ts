"use client"

import { useContext } from 'react'
import { NovaKitContext } from './context'

export function useNova() {
  const context = useContext(NovaKitContext)
  if (!context) {
    throw new Error('useNova must be used within a NovaProvider')
  }
  return context
}

