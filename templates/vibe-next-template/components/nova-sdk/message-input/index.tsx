"use client"

import React, { useState, useCallback, useRef, type KeyboardEvent, memo } from 'react'
import { Send, Square, Paperclip } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { SendMessagePayload, UploadFile } from '../types'
import { useNovaStore } from '../store/useNovaStore'
import { useNova } from '../context/useNova'
import { useFileUploader } from '../hooks/useFileUploader'
import { FilePreviewList } from './FilePreviewList'

export interface MessageInputProps {
  /** 占位符文本 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 是否正在加载 */
  loading?: boolean
  /** 发送消息回调 */
  onSend?: (payload: SendMessagePayload) => void
  /** 终止消息回调 */
  onStop?: () => void
  /** 文件列表变化回调 */
  onFilesChange?: (files: UploadFile[]) => void
  /** 自定义类名 */
  className?: string
  /** 是否显示文件上传按钮 */
  showUpload?: boolean
}

/**
 * 消息输入框组件
 */
export const MessageInput = memo(({
  placeholder = '请输入消息...',
  onSend,
  className,
  showUpload = true,
}: MessageInputProps) => {
  const { client: apiClient } = useNova()
  const conversationId = useNovaStore(state => state.conversationId)
  const loading = useNovaStore(state => state.messageSending)
  const setLoading = useNovaStore(state => state.setMessageSending)

  const [content, setContent] = useState('')
  const [files, setFiles] = useState<UploadFile[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadEnd = useCallback((file: UploadFile) => {
    setFiles(prev => prev.map(f => f.uid === file.uid ? file : f))
  }, [])

  const handleUploadStart = useCallback((file: UploadFile) => {
    setFiles(prev => [...prev, file])
  }, [])

  const handleFileUpdate = useCallback((file: UploadFile) => {
    setFiles(prev => prev.map(f => f.uid === file.uid ? file : f))
  }, [])

  const { uploadFile, accept } = useFileUploader({
    onUploadStart: handleUploadStart,
    onFileUpdate: handleFileUpdate,
    onUploadEnd: handleUploadEnd,
  })

  // Filter valid files and check loading status
  const uploading = files.some(f => f.uploadStatus === 'uploading' || f.uploadStatus === 'pending')
  const contentEmpty = !content.trim() && files.length === 0

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      for (const file of selectedFiles) {
        await uploadFile(file)
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [uploadFile])

  const removeFile = useCallback((uid: string) => {
    setFiles(prev => prev.filter(f => f.uid !== uid))
  }, [])

  // 发送消息
  const handleSend = useCallback(() => {
    if (contentEmpty) return

    // Check if any files are still uploading
    if (uploading) {
      console.warn('请等待文件上传完成')
      return
    }

    // Filter out failed uploads
    const validFiles = files.filter(f => f.uploadStatus === 'success')
    const fileIds = validFiles.map(f => f.upload_file_id).filter(Boolean) as string[]

    const payload: SendMessagePayload = {
      content: content.trim(),
      upload_file_ids: fileIds.length > 0 ? fileIds : undefined
    }

    onSend?.(payload)
    setContent('')
    setFiles([])

    // 清空已上传的文件
  }, [content, contentEmpty, onSend, files, uploading])

  // 处理键盘事件
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  // 自动调整高度
  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target
    setContent(textarea.value)

    // 自动调整高度
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
  }, [])

  const handleStop = useCallback(async () => {
    setLoading(true)
    await apiClient.post('/chat/stop', { conversation_id: conversationId })
    setLoading(false)
  }, [apiClient, conversationId, setLoading])

  return (
    <div className={cn('w-full', className)}>
      <div className="relative bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600 focus-within:border-primary dark:focus-within:border-primary focus-within:shadow-md overflow-hidden">

        {/* File Preview List */}
        <FilePreviewList
          files={files}
          onRemove={removeFile}
          disabled={loading}
        />

        <div className="relative flex items-center gap-2 px-4 h-[46px]">
          {/* Upload Button */}
          {showUpload && (
            <div className="shrink-0">
              <input
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept={accept}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                title="Process Files"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* 文本输入区域 */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              className={cn(
                'w-full resize-none border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0',
                'px-[4px] py-[4px] bg-transparent min-h-0 max-h-[100px]',
                'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                'text-slate-900 dark:text-slate-100 text-[15px] leading-normal',
                'overflow-y-auto transition-all duration-200 h-full',
                '[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full dark:[&::-webkit-scrollbar-thumb]:bg-slate-600'
              )}
            />
          </div>

          {/* 按钮组 */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* 终止按钮 */}
            {loading && <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={handleStop}
              title="终止"
              className={cn(
                'h-8 w-8 rounded-full transition-all duration-200',
                loading ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950' : 'text-slate-400'
              )}
            >
              <Square
                className="w-4 h-4"
                fill="currentColor"
                strokeWidth={0}
              />
            </Button>}

            {/* 发送按钮 */}
            <Button
              type="button"
              size="icon"
              disabled={contentEmpty}
              onClick={handleSend}
              className={cn(
                'h-8 w-8 rounded-full transition-all duration-200',
                contentEmpty
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow'
              )}
              title="发送"
            >
              <Send className="w-4 h-4" strokeWidth={2.5} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
})

MessageInput.displayName = 'MessageInput'