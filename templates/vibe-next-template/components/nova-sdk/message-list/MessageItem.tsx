"use client"

import { cn } from '@/utils/cn'
import { Card } from '@/components/ui/card'
import type { ExtendedEvent, Attachment, ImageAttachment, ApiEvent } from '../types'
import { AttachmentItem } from './AttachmentItem'
import { ImageAttachmentItem } from './ImageAttachmentItem'
import { ToolCallAction } from './ToolCallAction'
import {
  isUserInput,
  getMessageContent,
  getAttachments,
  getImageAttachments,
  getToolCallAction,
  getPlanStepState,
} from './utils'

export interface MessageItemProps {
  /** 事件数据 */
  event: ExtendedEvent
  /** 自定义类名 */
  className?: string
  /** 附件点击回调 */
  onAttachmentClick?: (attachment: Attachment) => void
  /** 图片附件点击回调 */
  onImageAttachmentClick?: (image: ImageAttachment) => void
  /** 工具调用点击回调 */
  onToolCallClick?: (event: ApiEvent) => void
}

/**
 * 消息项组件 - 展示单条消息
 */
export function MessageItem({ event, className, onAttachmentClick, onImageAttachmentClick, onToolCallClick }: MessageItemProps) {
  const userInput = isUserInput(event)
  const content = getMessageContent(event)
  const attachments = getAttachments(event)
  const imageAttachments = getImageAttachments(event)
  const toolCallAction = getToolCallAction(event)
  const planStepState = getPlanStepState(event)

  // task_end 不需要任何渲染
  if (event.event_type === 'task_end') {
    return null
  }

  // tool_call 事件：只显示 action，不显示其他内容
  if (event.event_type === 'tool_call' && toolCallAction) {
    return (
      <div
        className={cn(
          'flex flex-col text-sm relative w-full',
          'items-start',
          className
        )}
        data-event-id={event.event_id}
      >
        <ToolCallAction
          name={toolCallAction.name}
          arguments={toolCallAction.arguments}
          action_type={toolCallAction.action_type}
          event={event as ApiEvent}
          onClick={onToolCallClick}
        />
        {event.timestamp && (
          <div className="text-xs text-muted-foreground mt-1 px-1">
            {new Date(event.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    )
  }

  // plan_step_state 为 canceled 时显示"用户取消"
  if (planStepState === 'canceled') {
    return (
      <div
        className={cn(
          'flex flex-col text-sm relative w-full',
          'items-start',
          className
        )}
        data-event-id={event.event_id}
      >
        <div className="text-sm text-muted-foreground italic px-1">
          用户取消
        </div>
        {event.timestamp && (
          <div className="text-xs text-muted-foreground mt-1 px-1">
            {new Date(event.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    )
  }

  // 空消息不渲染
  if (!content && attachments.length === 0 && imageAttachments.length === 0 && !toolCallAction) {
    return null
  }

  return (
    <div
      className={cn(
        'flex flex-col text-sm relative w-full',
        userInput ? 'items-end' : 'items-start',
        className
      )}
      data-event-id={event.event_id}
    >
      {/* 消息气泡 */}
      <Card
        className={cn(
          'max-w-[80%] px-4 py-2.5 shadow-sm',
          userInput
            ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md'
            : 'bg-muted rounded-2xl rounded-bl-md'
        )}
      >
        {/* 工具调用 Action */}
        {toolCallAction && (
          <div className="mb-2">
            <ToolCallAction
              name={toolCallAction.name}
              arguments={toolCallAction.arguments}
              action_type={toolCallAction.action_type}
              event={event as ApiEvent}
              onClick={onToolCallClick}
            />
          </div>
        )}

        {/* 文本内容 */}
        {content && (
          <div className={cn('whitespace-pre-wrap wrap-break-words leading-relaxed', userInput ? 'text-right' : '')}>
            {content}
          </div>
        )}

        {/* 图片附件 */}
        {imageAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {imageAttachments.map((image, index) => (
              <ImageAttachmentItem
                key={image.url || image.path || index}
                image={image}
                onClick={onImageAttachmentClick}
              />
            ))}
          </div>
        )}

        {/* 文件附件 */}
        {attachments.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {attachments.map((attachment, index) => (
              <div key={attachment.file_id}>
                <AttachmentItem
                  key={attachment.file_id || attachment.file_url || index}
                  attachment={attachment}
                  onClick={onAttachmentClick}
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 时间戳 */}
      {event.timestamp && (
        <div className="text-xs text-muted-foreground mt-1 px-1">
          {new Date(event.timestamp).toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}
