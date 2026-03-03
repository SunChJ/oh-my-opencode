"use client"

import { useCallback } from 'react'
import type { ApiEvent, Attachment, ImageAttachment, TaskArtifact } from '../types'

/**
 * 附件处理逻辑 Hook
 */
export function useAttachmentHandlers(onSelectAttachment: (artifact: TaskArtifact) => void) {
  // 处理附件点击
  const handleAttachmentClick = useCallback(
    (attachment: Attachment) => {
      const artifact: TaskArtifact = {
        path: attachment.path || attachment.file_url || attachment.file_id || '',
        file_name: attachment.file_name,
        file_type: attachment.file_type,
        url: attachment.file_url,
      }
      onSelectAttachment(artifact)
    },
    [onSelectAttachment]
  )

  // 处理图片附件点击
  const handleImageAttachmentClick = useCallback(
    (image: ImageAttachment) => {
      const getFileExtension = (str?: string): string => {
        if (!str) return 'jpg'
        const parts = str.split('.')
        const ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase().replace(/\?.*$/, '') : ''
        return ext || 'jpg'
      }

      const fileType =
        getFileExtension(image.file_name) || getFileExtension(image.path) || getFileExtension(image.url) || 'jpg'

      const artifact: TaskArtifact = {
        path: image.path || image.url || '',
        file_name: image.file_name || '图片',
        file_type: fileType,
        url: image.url,
      }
      onSelectAttachment(artifact)
    },
    [onSelectAttachment]
  )

  // 处理工具调用点击
  const handleToolCallClick = useCallback(
    (event: ApiEvent) => {
      const artifact: TaskArtifact = {
        path: event.event_id,
        file_name: (event.content?.tool_name as string) || '工具调用',
        file_type: 'tool_call',
        event_type: 'tool_call',
        tool_name: event.content?.tool_name as string | undefined,
        tool_input: event.content?.tool_input,
        tool_output: event.content?.tool_output,
      }
      onSelectAttachment(artifact)
    },
    [onSelectAttachment]
  )

  return {
    handleAttachmentClick,
    handleImageAttachmentClick,
    handleToolCallClick,
  }
}
