"use client"

import React, { useRef, useCallback, useEffect, memo } from 'react'
import { cn } from '@/utils/cn'
import { MessageList, type MessageListRef } from '../message-list'
import { TaskPanel } from '../task-panel'
import { NovaProvider } from '../context/Provider'
import { useNovaChatLogic } from '../hooks/useNovaChatLogic'
import { ChatHeader } from './ChatHeader'
import { ChatInputArea } from './ChatInputArea'
import { useNovaStore } from '../store/useNovaStore'
import { useEventProcessor } from '../hooks/useEventProcessor'
import { ApiEvent, PlatformConfig } from '../types'

export interface NovaChatProps {
  /** 代理 ID */
  agentId: string
  /** 会话 ID */
  conversationId: string

  /** 侧边面板宽度 */
  panelWidth?: number | string
  /** 是否正在加载 */
  loading?: boolean
  /** 输入框占位符 */
  placeholder?: string
  /** 是否禁用输入 */
  disabled?: boolean
  /** 空状态渲染 */
  emptyRender?: React.ReactNode
  /** 自定义类名 */
  className?: string
  /** 头部渲染 */
  header?: React.ReactNode

  // useNovaEvents 相关配置
  /** 平台配置（如果提供，则自动建立 WebSocket 连接和获取历史记录） */
  platformConfig: PlatformConfig
  /** WebSocket 重连次数限制，默认 3 */
  reconnectLimit?: number
  /** WebSocket 重连间隔（毫秒），默认 3000 */
  reconnectInterval?: number
  /** 获取认证 Token */
  getToken?: () => string | undefined
  /** 获取租户 ID */
  getTenantId?: () => string | undefined
  /** 新事件回调 */
  onEvent?: (event: ApiEvent) => void
  /** 错误回调 */
  onError?: (error: Error) => void
}

/**
 * Nova 聊天组件 - 整合消息列表、输入框和文件面板
 */
export const NovaChat = memo((props: NovaChatProps) => {
  const {
    agentId,
    conversationId,

    panelWidth = '50%',
    placeholder,
    disabled = false,
    emptyRender,
    className,
    header,
    platformConfig,
    reconnectLimit = 3,
    reconnectInterval = 3000,
    getToken,
    getTenantId,
    onEvent,
    onError,
  } = props

  const messageListRef = useRef<MessageListRef>(null)
  const init = useNovaStore((state) => state.init)
  const destroy = useNovaStore((state) => state.destroy)
  const status = useNovaStore((state) => state.status)
  const events = useNovaStore((state) => state.events)
  const artifacts = useNovaStore((state) => state.artifacts)

  // 使用主业务逻辑 Hook
  const {
    apiClient,
    loading,
    panelVisible,
    selectedAttachment,
    handleSend,
    handlePanelToggle,
    handlePanelClose,
    handleAttachmentClick,
    handleImageAttachmentClick,
    handleToolCallClick,
  } = useNovaChatLogic({
    conversationId,
    platformConfig,
    reconnectLimit,
    reconnectInterval,
    getToken,
    getTenantId,
    onEvent,
    onError,
    agentId
  })

  const messages = useEventProcessor(events)

  // 包装 handleSend 以添加滚动逻辑
  const handleSendWithScroll = useCallback(
    (payload: Parameters<typeof handleSend>[0]) => {
      handleSend(payload)

      // 延迟滚动到底部，确保消息已添加到列表中
      setTimeout(() => {
        messageListRef.current?.scrollToBottom('smooth')
      }, 100)
    },
    [handleSend]
  )

  useEffect(() => {
    if (agentId && conversationId) {
      init(agentId, conversationId)
    }

    return () => {
      destroy()
    }
  }, [agentId, conversationId, init, destroy])

  return (
    <NovaProvider client={apiClient} conversationId={conversationId}>
      <div className={cn('flex h-full bg-background w-full', className)}>
        {/* 主聊天区域 */}
        <div className="flex-1 flex flex-col min-w-0 w-full">
          <ChatHeader header={header} />

          {/* 消息列表 */}
          <MessageList
            ref={messageListRef}
            messages={messages}
            taskStatus={status}
            loading={loading}
            emptyRender={emptyRender}
            className="flex-1"
            onAttachmentClick={handleAttachmentClick}
            onImageAttachmentClick={handleImageAttachmentClick}
            onToolCallClick={handleToolCallClick}
          />

          {/* 输入区域 */}
          <ChatInputArea
            placeholder={placeholder}
            disabled={disabled}
            onSend={handleSendWithScroll}
            hasArtifacts={artifacts.length > 0}
            panelVisible={panelVisible}
            onPanelToggle={handlePanelToggle}
          />
        </div>

        {/* 侧边文件面板 */}
        {(artifacts.length > 0 || selectedAttachment) && panelVisible && (
          <TaskPanel
            artifacts={selectedAttachment ? [selectedAttachment] : artifacts}
            visible={panelVisible}
            width={panelWidth}
            onClose={handlePanelClose}
            initialSelected={selectedAttachment}
          />
        )}
      </div>
    </NovaProvider>
  )
})

NovaChat.displayName = 'NovaChat'