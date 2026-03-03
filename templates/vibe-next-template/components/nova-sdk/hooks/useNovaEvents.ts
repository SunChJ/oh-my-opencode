"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useMemoizedFn } from 'ahooks'
import { HTTPClient } from '@/http'
import { createWebSocketClient, ReadyState } from '../websocket'
import { ApiEvent, PlatformConfig } from '../types'
import { useNovaStore } from '../store/useNovaStore'

interface UseNovaEventsOptions {
  apiClient: HTTPClient;
  conversationId?: string
  platformConfig: PlatformConfig
  /** WebSocket 重连次数限制，默认 3 */
  reconnectLimit?: number
  /** WebSocket 重连间隔（毫秒），默认 3000 */
  reconnectInterval?: number
  /** 新事件回调 */
  onEvent?: (event: ApiEvent) => void
  /** 连接状态变化回调 */
  onConnectionChange?: (connected: boolean) => void
  /** 错误回调 */
  onError?: (error: Error) => void
}

interface UseNovaEventsResult {
  /** 错误信息 */
  error: Error | null
  /** 手动刷新历史记录 */
  refresh: () => Promise<void>
  /** 手动重连 WebSocket */
  reconnect: () => void
  /** 发送消息 */
  sendMessage: WebSocket['send']
}

/**
 * Nova 事件管理 Hook
 * 
 * 负责：
 * 1. 建立 WebSocket 连接接收实时事件
 * 2. 请求 event_list 接口获取历史记录
 * 3. 合并和管理事件列表
 */
export function useNovaEvents({
  apiClient,
  conversationId,
  platformConfig,
  reconnectLimit = 3,
  reconnectInterval = 3000,
  onError,
}: UseNovaEventsOptions): UseNovaEventsResult {
  const setLoading = useNovaStore((state) => state.setLoading)
  const setWSState = useNovaStore((state) => state.setWSState)

  const reset = useNovaStore((state) => state.reset)
  const destroy = useNovaStore((state) => state.destroy)

  const setEvents = useNovaStore((state) => state.setEvents)
  const updateEvent = useNovaStore((state) => state.updateEvent)

  // 状态
  const [reconnectId, setReconnectId] = useState(0)
  const [error, setError] = useState<Error | null>(null)

  // 更新错误状态
  const handleError = useMemoizedFn((err: Error | null) => {
    setError(err)
    if (err) {
      onError?.(err)
    }
  })

  const wsClient = useMemo(() => {
    // if (!conversationId) return null
    if (reconnectId) {
      console.log('reconnecting...', reconnectId)
    }

    // 构建 WebSocket URL
    const wsUrl = new URL(platformConfig.wssUrl)
    if (conversationId) {
      wsUrl.searchParams.set('conversation_id', conversationId)
    }

    const client = createWebSocketClient(wsUrl.toString(), {
      reconnectLimit,
      reconnectInterval,
      token: platformConfig.token,
      tenantId: platformConfig.tenantId,
      onOpen: () => {
        setWSState(true, ReadyState.Open)
        handleError(null)
        // 连接成功后切换到当前会话
        if (conversationId) {
          client.switchConversation(conversationId)
        }
      },
      onClose: () => {
        setWSState(false, ReadyState.Closed)
      },
      onError: () => {
        handleError(new Error('WebSocket connection error'))
      },
      onMessage: (event: ApiEvent) => {
        updateEvent(event)
      },
    })

    return client
  }, [reconnectId, platformConfig, conversationId, reconnectLimit, reconnectInterval, setWSState, handleError, updateEvent])

  // 获取历史记录
  const fetchEventList = useCallback(async () => {
    if (!conversationId) return

    reset()
    setLoading(true)
    handleError(null)

    try {
      const response = await apiClient.get<{ data: { chat_event_list: ApiEvent[] } }>('/chat/event', {
        conversation_id: conversationId,
        page_no: 1,
        page_size: 3000,
      })

      // 提取 data.data.chat_event_list 字段
      const events = response?.data?.chat_event_list || []
      setEvents(events)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch event list')
      handleError(error)
    } finally {
      setLoading(false)
    }
  }, [conversationId, reset, setLoading, handleError, apiClient, setEvents])

  // 手动重连
  const reconnect = useCallback(() => {
    if (wsClient) {
      wsClient.connect()
    } else {
      setReconnectId((prev) => prev + 1)
    }
  }, [wsClient])

  // 发送消息
  const sendMessage = useCallback<WebSocket['send']>((data) => {
    if (wsClient) {
      wsClient.sendMessage(data)
    } else {
      throw new Error('WebSocket not connected')
    }
  }, [wsClient])

  // 主 effect：当 conversationId 或 platformConfig 变化时处理
  useEffect(() => {
    console.log('conversationId', conversationId)
    if (!conversationId) {
      reset()
      setWSState(false, ReadyState.Closed)
      return
    }

    fetchEventList()
    if (wsClient && wsClient.readyState === ReadyState.Open) {
      wsClient.switchConversation(conversationId)
    }
  }, [conversationId, wsClient, fetchEventList, setWSState, reset])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      destroy()
      wsClient?.cleanup()
    }
  }, [destroy, wsClient])

  return {
    error,
    refresh: fetchEventList,
    reconnect,
    sendMessage,
  }
}