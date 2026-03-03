"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext } from 'react'
import { HTTPClient } from '@/http'
import type { TaskArtifact } from '../types'

export interface NovaContextValue {
  client: HTTPClient
  getArtifactUrl: (artifact: TaskArtifact, params?: Record<string, string>) => Promise<string>
}

export const NovaKitContext = createContext<NovaContextValue>(null as any)