"use client"

import { useState, useCallback, useEffect } from 'react'
import type { PlatformConfig, SendMessagePayload } from '../types'
import { useNovaStore } from '../store/useNovaStore'

interface UseMessageSenderProps {
  agentId?: string
  conversationId?: string
  platformConfig?: PlatformConfig
  sendMessage?: (message: string) => void
}

export function useMessageSender({
  agentId,
  conversationId,
  platformConfig,
  sendMessage,
}: UseMessageSenderProps) {
  const events = useNovaStore((state) => state.events)

  const [sendingMessage, setSendingMessage] = useState(false)

  // Send Message Logic
  const handleSend = useCallback(
    (payload: SendMessagePayload) => {
      // If platformConfig is provided, send via WebSocket
      if (platformConfig && sendMessage) {
        try {
          setSendingMessage(true)
          const message = {
            message_type: 'chat',
            conversation_id: conversationId,
            agent_id: agentId,
            agent_model: 'Nova Pro',
            content: payload.content,
            refer_content: payload.refer_content || '',
            upload_file_ids: payload.upload_file_ids,
          }
          sendMessage(JSON.stringify(message))
        } catch (error) {
          console.error('Failed to send message via WebSocket:', error)
          setSendingMessage(false)
        }
      }
    },
    [platformConfig, sendMessage, conversationId, agentId]
  )

  // Monitor events to stop loading state
  useEffect(() => {
    if (events.length > 0) {
      const lastEvent = events.at(-1)!
      const taskStatus = lastEvent.task_status as string | undefined
      if (taskStatus === 'success' || taskStatus === 'completed' || taskStatus === 'failed' || taskStatus === 'error') {
        // Use queueMicrotask to defer state update and avoid cascading renders
        queueMicrotask(() => {
          setSendingMessage(false)
        })
      }
    }
  }, [events])

  return {
    sendingMessage,
    setSendingMessage,
    handleSend
  }
}
