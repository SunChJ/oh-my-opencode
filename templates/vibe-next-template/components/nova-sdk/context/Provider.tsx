import { ReactNode, useCallback } from 'react'
import { HTTPClient } from '@/http'
import type { TaskArtifact } from '../types'
import { NovaContextValue, NovaKitContext } from './context'

export interface NovaProviderProps {
  client: HTTPClient
  conversationId: string
  children: ReactNode
}

export function NovaProvider(props: NovaProviderProps) {
  const { client, conversationId, children } = props

  const getArtifactUrl = useCallback(
    async (artifact: TaskArtifact, params?: Record<string, string>) => {
      try {
        const url = await client.post<string>('/file/sign', {
          file_path: artifact.path,
          task_id: conversationId,
          params
        })
        return url
      } catch (error) {
        console.error('Failed to fetch artifact URL:', error)
        return artifact.path
      }
    },
    [conversationId, client]
  )

  const value: NovaContextValue = {
    client,
    getArtifactUrl
  }

  return (
    <NovaKitContext.Provider value={value}>
      {children}
    </NovaKitContext.Provider>
  )
}


