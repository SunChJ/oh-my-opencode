/**
 * WebSocket 客户端封装
 * 
 * 提供自动重连、心跳检测、网络状态监听等功能
 */

import { ApiEvent } from './types'

function latest<T>(value: T) {
  const ref = { current: value }
  return ref
}

export const ReadyState = {
  Connecting: 0,
  Open: 1,
  Closing: 2,
  Closed: 3,
} as const

export type ReadyState = (typeof ReadyState)[keyof typeof ReadyState]

export interface Result {
  sendMessage: WebSocket['send']
  disconnect: () => void
  connect: () => void
  readyState: ReadyState
  webSocketIns?: WebSocket
  clearHeartbeat: () => void
  switchConversation: (conversationId: string) => void
  cleanup: () => void
}

export interface HeartbeatOptions {
  /** 心跳间隔，默认 20000ms */
  heartbeatInterval?: number
  /** 心跳超时，默认 22000ms */
  heartbeatTimeout?: number
  /** 心跳消息，默认 { message_type: 'ping' } */
  heartbeatMessage?: string | object | (() => string | object)
  /** 心跳响应类型，默认 'pong' */
  heartbeatResponseType?: string
}

// WebSocket 事件类型定义
type WSOpenEvent = Event
interface WSCloseEvent {
  code?: number
  reason?: string
  wasClean?: boolean
}
interface WSMessageEvent {
  data: string | ArrayBuffer | Blob
}
type WSErrorEvent = Event

export interface Options {
  /** 重连次数限制，默认 3 */
  reconnectLimit?: number
  /** 重连间隔，默认 3000ms */
  reconnectInterval?: number
  /** 是否手动连接，默认 false */
  manual?: boolean
  /** 连接成功回调 */
  onOpen?: (event: WSOpenEvent, instance: WebSocket) => void
  /** 连接关闭回调 */
  onClose?: (event: WSCloseEvent, instance: WebSocket) => void
  /** 收到消息回调 */
  onMessage?: (message: ApiEvent, instance: WebSocket) => void
  /** 连接错误回调 */
  onError?: (event: WSErrorEvent, instance: WebSocket) => void
  /** WebSocket 协议 */
  protocols?: string | string[]
  /** 心跳配置，传 false 禁用心跳 */
  heartbeat?: HeartbeatOptions | boolean
  /** 是否监听网络状态变化，默认 true */
  enableNetworkListener?: boolean
  /** 是否监听文档可见性变化，默认 true */
  enableVisibilityListener?: boolean
  /** 重连延迟，默认 300ms */
  reconnectDelay?: number
  /** 重连防抖时间，默认 1000ms */
  reconnectDebounce?: number
  /** 获取认证 Token */
  token?: string
  /** 获取租户 ID */
  tenantId?: string
}

/**
 * 创建 WebSocket 客户端
 */
export function createWebSocketClient(
  socketUrl: string,
  options: Options = {},
): Result {
  const {
    reconnectLimit = 3,
    reconnectInterval = 3 * 1000,
    manual = false,
    onOpen,
    onClose,
    onMessage,
    onError,
    protocols,
    heartbeat: enableHeartbeat = true,
    enableNetworkListener = true,
    enableVisibilityListener = true,
    reconnectDelay = 300,
    reconnectDebounce = 1000,
    token,
    tenantId,
  } = options

  const heartbeatOptions: HeartbeatOptions =
    typeof enableHeartbeat === 'object' ? enableHeartbeat : {}
  const {
    heartbeatInterval = 20000,
    heartbeatTimeout = 22000,
    heartbeatMessage = { message_type: 'ping' },
    heartbeatResponseType = 'pong',
  } = heartbeatOptions

  // 提前声明函数，避免使用前未定义
  let disconnectFn: () => void = () => {
    throw new Error('disconnectFn not initialized')
  }
  let connectWsFn: () => void = () => {
    throw new Error('connectWsFn not initialized')
  }

  const onOpenRef = latest(onOpen)
  const onCloseRef = latest(onClose)
  const onMessageRef = latest(onMessage)
  const onErrorRef = latest(onError)

  // 确保 ref 始终指向最新的回调
  if (onMessage) {
    onMessageRef.current = onMessage
  }

  const reconnectTimesRef = latest(0)
  const reconnectTimerRef = latest<ReturnType<typeof setTimeout> | undefined>(undefined)
  const websocketRef = latest<WebSocket | undefined>(undefined)
  const readyStateRef = latest<ReadyState>(ReadyState.Closed)

  // 心跳相关
  const heartbeatTimerRef = latest<ReturnType<typeof setTimeout> | undefined>(undefined)
  const heartbeatTimeoutTimerRef = latest<ReturnType<typeof setTimeout> | undefined>(undefined)
  const waitingForPongRef = latest(false)

  // 网络和可见性状态
  const isOnlineRef = latest(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const isVisibleRef = latest(typeof document !== 'undefined' ? !document.hidden : true)

  // 重连防抖定时器
  const reconnectDebounceTimerRef = latest<ReturnType<typeof setTimeout> | undefined>(undefined)

  // 更新 readyState 的辅助函数
  const setReadyState = (state: ReadyState) => {
    readyStateRef.current = state
  }

  // 获取当前 readyState
  const getReadyState = (): ReadyState => {
    if (websocketRef.current) {
      const wsState = websocketRef.current.readyState
      if (wsState === WebSocket.CONNECTING) return ReadyState.Connecting
      if (wsState === WebSocket.OPEN) return ReadyState.Open
      if (wsState === WebSocket.CLOSING) return ReadyState.Closing
      if (wsState === WebSocket.CLOSED) return ReadyState.Closed
    }
    return readyStateRef.current
  }

  // 清除心跳相关定时器
  const clearHeartbeat = () => {
    if (heartbeatTimerRef.current) {
      clearTimeout(heartbeatTimerRef.current)
      heartbeatTimerRef.current = undefined
    }
    if (heartbeatTimeoutTimerRef.current) {
      clearTimeout(heartbeatTimeoutTimerRef.current)
      heartbeatTimeoutTimerRef.current = undefined
    }
    waitingForPongRef.current = false
  }

  // 处理心跳超时
  const handlePingTimeout = () => {
    if (!isOnlineRef.current) {
      waitingForPongRef.current = false
      clearHeartbeat()
      return
    }
    waitingForPongRef.current = false
    clearHeartbeat()
    disconnectFn()
  }

  // 发送心跳
  const sendHeartbeat = () => {
    if (!isOnlineRef.current) {
      return
    }
    if (waitingForPongRef.current) {
      return
    }
    if (websocketRef.current && getReadyState() === ReadyState.Open) {
      try {
        const message =
          typeof heartbeatMessage === 'function'
            ? heartbeatMessage()
            : heartbeatMessage
        websocketRef.current.send(
          typeof message === 'string' ? message : JSON.stringify(message),
        )
        waitingForPongRef.current = true

        heartbeatTimeoutTimerRef.current = setTimeout(
          handlePingTimeout,
          heartbeatTimeout,
        )
      } catch {
        clearHeartbeat()
      }
    } else {
      clearHeartbeat()
    }
  }

  // 处理心跳响应
  const handlePongReceived = () => {
    if (!waitingForPongRef.current) {
      return
    }
    waitingForPongRef.current = false

    if (heartbeatTimeoutTimerRef.current) {
      clearTimeout(heartbeatTimeoutTimerRef.current)
      heartbeatTimeoutTimerRef.current = undefined
    }

    heartbeatTimerRef.current = setTimeout(sendHeartbeat, heartbeatInterval)
  }

  // 启动心跳
  const startHeartbeat = () => {
    if (!enableHeartbeat) return
    clearHeartbeat()
    heartbeatTimerRef.current = setTimeout(sendHeartbeat, 1000)
  }

  // 处理原始消息，检查是否是心跳响应
  const handleRawMessage = (messageData: string): boolean => {
    try {
      const rawMessage = JSON.parse(messageData)
      if (
        rawMessage.data?.message_type === heartbeatResponseType ||
        rawMessage.message_type === heartbeatResponseType
      ) {
        handlePongReceived()
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const reconnect = () => {
    if (
      reconnectTimesRef.current < reconnectLimit &&
      getReadyState() !== ReadyState.Open
    ) {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }

      reconnectTimerRef.current = setTimeout(() => {
        connectWsFn()
        reconnectTimesRef.current++
      }, reconnectInterval)
    }
  }

  connectWsFn = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
    }

    if (websocketRef.current) {
      websocketRef.current.close()
    }

    // 构建 WebSocket URL
    const url = new URL(socketUrl)

    if (token) {
      url.searchParams.set('Authorization', token)
    }
    if (tenantId) {
      url.searchParams.set('Tenant-Id', tenantId)
    }

    const ws = new WebSocket(url.toString(), protocols)
    setReadyState(ReadyState.Connecting)

    ws.onerror = event => {
      if (websocketRef.current !== ws) {
        return
      }
      reconnect()
      onErrorRef.current?.(event, ws)
      setReadyState(ReadyState.Closed)
    }

    ws.onopen = event => {
      if (websocketRef.current !== ws) {
        return
      }
      onOpenRef.current?.(event, ws)
      reconnectTimesRef.current = 0
      setReadyState(ReadyState.Open)
      startHeartbeat()
    }

    ws.onmessage = (message: WSMessageEvent) => {
      if (websocketRef.current !== ws) {
        return
      }

      const messageData = typeof message.data === 'string' ? message.data : String(message.data)

      // 先检查是否是心跳响应
      if (enableHeartbeat && handleRawMessage(messageData)) {
        return
      }

      // 解析消息并触发回调
      try {
        const parsedMessage: ApiEvent = JSON.parse(messageData).data
        onMessageRef.current?.(parsedMessage, ws)
      } catch {
        // 如果解析失败，尝试作为原始数据传递
        console.warn('[WebSocket] Failed to parse message:', messageData)
      }
    }

    ws.onclose = event => {
      onCloseRef.current?.(event, ws)
      clearHeartbeat()
      // closed by server
      if (websocketRef.current === ws) {
        reconnect()
      }
      // closed by disconnect or closed by server
      if (!websocketRef.current || websocketRef.current === ws) {
        setReadyState(ReadyState.Closed)
      }
    }

    websocketRef.current = ws
  }

  const sendMessage: WebSocket['send'] = message => {
    const currentState = getReadyState()
    if (currentState === ReadyState.Open) {
      websocketRef.current?.send(message)
    } else {
      throw new Error('WebSocket disconnected')
    }
  }

  // 切换会话
  const switchConversation = (conversationId: string) => {
    // 检查网络状态
    if (!isOnlineRef.current) {
      throw new Error('网络连接异常，无法切换会话')
    }

    // 检查 WebSocket 连接状态
    const currentState = getReadyState()
    if (!websocketRef.current || currentState !== ReadyState.Open) {
      throw new Error('WebSocket 未连接，无法切换会话')
    }

    try {
      const message = JSON.stringify({
        message_type: 'switch_conversation',
        conversation_id: conversationId,
      })
      websocketRef.current.send(message)
    } catch (error) {
      throw new Error(`切换会话失败: ${error}`)
    }
  }

  const connect = () => {
    reconnectTimesRef.current = 0
    connectWsFn()
  }

  disconnectFn = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
    }
    if (reconnectDebounceTimerRef.current) {
      clearTimeout(reconnectDebounceTimerRef.current)
    }

    reconnectTimesRef.current = reconnectLimit
    clearHeartbeat()
    websocketRef.current?.close(1000, '手动断开')
    websocketRef.current = undefined
    setReadyState(ReadyState.Closed)
  }

  // 处理网络断开
  const handleNetworkOffline = () => {
    clearHeartbeat()
    const currentState = getReadyState()
    if (
      currentState === ReadyState.Open ||
      currentState === ReadyState.Connecting
    ) {
      disconnectFn()
    }
  }

  // 重连函数 - 统一处理重连逻辑
  const attemptReconnect = () => {
    // 清除之前的防抖定时器
    if (reconnectDebounceTimerRef.current) {
      clearTimeout(reconnectDebounceTimerRef.current)
    }

    reconnectDebounceTimerRef.current = setTimeout(() => {
      const currentState = getReadyState()
      // 已连接或正在连接时跳过
      if (
        currentState === ReadyState.Open ||
        currentState === ReadyState.Connecting
      ) {
        return
      }

      clearHeartbeat()

      const isClosed =
        currentState === ReadyState.Closed ||
        currentState === ReadyState.Closing

      if (isClosed) {
        connect()
      } else {
        disconnectFn()
        setTimeout(() => {
          if (
            isOnlineRef.current &&
            getReadyState() !== ReadyState.Open &&
            getReadyState() !== ReadyState.Connecting
          ) {
            connect()
          }
        }, reconnectDelay)
      }
    }, reconnectDebounce)
  }

  // 网络状态监听
  let cleanupNetworkListener: (() => void) | undefined

  if (enableNetworkListener && typeof window !== 'undefined') {
    const handleOnline = () => {
      isOnlineRef.current = true
      attemptReconnect()
    }

    const handleOffline = () => {
      isOnlineRef.current = false
      handleNetworkOffline()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    cleanupNetworkListener = () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }

  // 文档可见性监听
  let cleanupVisibilityListener: (() => void) | undefined

  if (enableVisibilityListener && typeof document !== 'undefined') {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden
      isVisibleRef.current = isVisible
      if (isVisible && isOnlineRef.current) {
        const currentState = getReadyState()
        if (
          currentState === ReadyState.Closed ||
          currentState === ReadyState.Closing
        ) {
          attemptReconnect()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    cleanupVisibilityListener = () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }

  // 自动连接
  if (!manual && socketUrl) {
    connect()
  }

  // 清理函数
  const cleanup = () => {
    disconnectFn()
    cleanupNetworkListener?.()
    cleanupVisibilityListener?.()
  }

  const result: Result = {
    sendMessage,
    connect,
    disconnect: disconnectFn,
    get readyState() {
      return getReadyState()
    },
    get webSocketIns() {
      return websocketRef.current
    },
    clearHeartbeat,
    switchConversation,
    cleanup,
  }

  return result
}
