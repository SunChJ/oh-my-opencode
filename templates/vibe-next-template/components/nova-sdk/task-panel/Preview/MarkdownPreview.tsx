"use client"

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface MarkdownPreviewProps {
  /** Markdown 文件的 URL */
  url: string
}

/**
 * Markdown 预览组件 - 接收 URL，fetch 内容后渲染
 */
export function MarkdownPreview({ url }: MarkdownPreviewProps) {
  const [content, setContent] = React.useState<string>('')
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!url) return

    setLoading(true)
    fetch(url)
      .then(res => res.text())
      .then(text => setContent(text))
      .catch(() => setContent('加载失败'))
      .finally(() => setLoading(false))
  }, [url])

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-muted-foreground">
        <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
        <span className="text-sm mt-2">加载中...</span>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </ScrollArea>
  )
}
