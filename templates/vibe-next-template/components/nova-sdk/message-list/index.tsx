"use client"

import React, { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react'
import { ArrowDown, MessageCircle } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ExtendedEvent, Attachment, ImageAttachment, ApiEvent } from '../types'
import { TaskStatus } from '../types'
import { MessageItem } from './MessageItem'

export interface MessageListProps {
  /** 消息列表（按步骤分组） */
  messages: ExtendedEvent[][]
  /** 任务状态 */
  taskStatus?: TaskStatus
  /** 自定义类名 */
  className?: string
  /** 是否自动滚动到底部 */
  autoScroll?: boolean
  /** 空状态渲染 */
  emptyRender?: React.ReactNode
  /** 加载中状态 */
  loading?: boolean
  /** 附件点击回调 */
  onAttachmentClick?: (attachment: Attachment) => void
  /** 图片附件点击回调 */
  onImageAttachmentClick?: (image: ImageAttachment) => void
  /** 工具调用点击回调 */
  onToolCallClick?: (event: ApiEvent) => void
}

export interface MessageListRef {
  scrollToBottom: (behavior?: ScrollBehavior) => void
}

/**
 * 消息列表组件 - 展示对话流
 */
const InnerMessageList = forwardRef<MessageListRef, MessageListProps>(({
  messages,
  taskStatus = TaskStatus.PENDING,
  className,
  autoScroll = true,
  emptyRender,
  loading = false,
  onAttachmentClick,
  onImageAttachmentClick,
  onToolCallClick,
}, ref) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const userTouchedRef = useRef(false)
  const autoScrollEnabledRef = useRef(autoScroll)

  // 扁平化消息列表
  const flatMessages = messages.flat()

  // 滚动到底部
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior,
      })
    }
    userTouchedRef.current = false
    autoScrollEnabledRef.current = true
  }, [])

  // 暴露滚动方法给父组件
  useImperativeHandle(ref, () => ({
    scrollToBottom,
  }), [scrollToBottom])

  // 监听滚动事件
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    const isAtBottom = distanceFromBottom < 50

    // 用户主动滚动
    if (!isAtBottom && !userTouchedRef.current) {
      userTouchedRef.current = true
      autoScrollEnabledRef.current = false
    }

    // 滚动到底部恢复自动滚动
    if (isAtBottom && userTouchedRef.current) {
      userTouchedRef.current = false
      autoScrollEnabledRef.current = true
    }

    setShowScrollButton(!isAtBottom && flatMessages.length > 3)
  }, [flatMessages.length])

  // 消息变化时自动滚动
  useEffect(() => {
    if (autoScroll && autoScrollEnabledRef.current && !userTouchedRef.current) {
      const behavior = taskStatus === TaskStatus.IN_PROGRESS ? 'smooth' : 'auto'
      scrollToBottom(behavior)
    }
  }, [flatMessages.length, autoScroll, taskStatus, scrollToBottom])

  // 初始化滚动
  useEffect(() => {
    if (flatMessages.length > 0) {
      scrollToBottom('auto')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 空状态
  if (flatMessages.length === 0 && !loading) {
    return (
      <div className={cn('flex-1 flex items-center justify-center', className)}>
        {emptyRender || (
          <div className="text-center text-muted-foreground">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted" />
            <p>暂无消息</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('relative flex-1 h-full overflow-hidden', className)}>
      {/* 消息列表滚动区域 */}
      <ScrollArea
        ref={scrollRef}
        className="h-full px-4 py-4"
        onScroll={handleScroll}
      >
        <div className="max-w-3xl mx-auto space-y-4">
          {flatMessages.map((event, index) => (
            <MessageItem
              key={event.event_id || index}
              event={event}
              onAttachmentClick={onAttachmentClick}
              onImageAttachmentClick={onImageAttachmentClick}
              onToolCallClick={onToolCallClick}
            />
          ))}

          {/* 加载中指示器 */}
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                />
                <span
                  className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
              <span className="text-sm">正在处理...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 滚动到底部按钮 */}
      {showScrollButton && (
        <Button
          variant="outline"
          size="icon"
          className={cn(
            'absolute bottom-4 left-1/2 -translate-x-1/2',
            'rounded-full shadow-lg',
            'animate-in fade-in-0 zoom-in-95'
          )}
          onClick={() => scrollToBottom()}
        >
          <ArrowDown className="w-5 h-5" />
        </Button>
      )}
    </div>
  )
})

InnerMessageList.displayName = 'MessageList'

export const MessageList = React.memo(InnerMessageList)
export default MessageList

// 导出 MessageItem
export { MessageItem } from './MessageItem'
