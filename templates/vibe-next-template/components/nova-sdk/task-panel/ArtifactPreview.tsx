"use client"

import React, { useState, useCallback } from 'react'
import { ChevronLeft, Download, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Image } from '@/components/ui/image'
import { ImagePreview as ImagePreviewComponent } from '@/components/ui/image-preview'
import type { TaskArtifact } from '../types'
import { isImageFile } from './utils'
import { useNova } from '../context/useNova'
import { detectToolType, ToolType, extractShellOutput, extractScriptCode, getDisplayTitle } from './Preview/previewUtils'
import { ScriptPreview } from './Preview/ScriptPreview'
import { ToolCallPreview } from './Preview/ToolCallPreview'
import { MarkdownPreview } from './Preview/MarkdownPreview'
import { PptPreview } from './Preview/PptPreview'

export interface ArtifactPreviewProps {
  /** 当前展示的文件 */
  artifact: TaskArtifact | null
  /** 所有图片（用于切换） */
  images?: TaskArtifact[]
  /** 获取文件 URL 的函数 */
  getUrl?: (artifact: TaskArtifact) => string | Promise<string>
  /** 返回按钮点击回调 */
  onBack?: () => void
  /** 下载按钮点击回调 */
  onDownload?: (artifact: TaskArtifact) => void
  /** 关闭面板回调 */
  onClose?: () => void
  /** 自定义类名 */
  className?: string
}

/**
 * 图片预览组件
 */
/**
 * 图片缩略图组件
 */
function ImageThumbnail({ artifact }: { artifact: TaskArtifact }) {
  const { getArtifactUrl } = useNova()
  const [url, setUrl] = useState<string>(artifact.url || '')
  const [loading, setLoading] = useState(!artifact.url)

  React.useEffect(() => {
    if (artifact.url) {
      setUrl(artifact.url)
      setLoading(false)
    } else if (artifact.path && getArtifactUrl) {
      setLoading(true)
      getArtifactUrl(artifact).then(url => {
        setUrl(url || '')
        setLoading(false)
      }).catch(() => {
        setLoading(false)
      })
    }
  }, [artifact, getArtifactUrl])

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="w-4 h-4 border border-muted border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <Image
      src={url}
      alt={artifact.file_name}
      className="w-full h-full object-cover"
      loading="lazy"
    />
  )
}

/**
 * 图片预览组件
 */
function ImagePreview({
  artifact,
  images = [],
  getUrl,
  onSelect,
}: {
  artifact: TaskArtifact
  images?: TaskArtifact[]
  getUrl?: (artifact: TaskArtifact) => string | Promise<string>
  onSelect?: (artifact: TaskArtifact) => void
}) {
  const { getArtifactUrl } = useNova()
  const [url, setUrl] = useState<string>(artifact.url || '')
  const [loading, setLoading] = useState(!artifact.url)

  // 加载 URL
  React.useEffect(() => {
    if (artifact.url) {
      setUrl(artifact.url)
      setLoading(false)
    } else if (getUrl) {
      setLoading(true)
      Promise.resolve(getUrl(artifact)).then(u => {
        setUrl(u)
        setLoading(false)
      })
    } else if (artifact.path && getArtifactUrl) {
      setLoading(true)
      getArtifactUrl(artifact).then(url => {
        setUrl(url || '')
        setLoading(false)
      }).catch(() => {
        setLoading(false)
      })
    }
  }, [artifact, getUrl, getArtifactUrl])

  return (
    <div className="flex flex-col h-full">
      {/* 主图展示区 */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
            <span className="text-sm">加载中...</span>
          </div>
        ) : (
          <ImagePreviewComponent src={url} alt={artifact.file_name} className='max-w-[80%]'>
            <Image
              src={url}
              alt={artifact.file_name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
            />
          </ImagePreviewComponent>
        )}
      </div>

      {/* 图片缩略图列表（如果有多张） */}
      {images.length > 1 && (
        <div className="shrink-0 border-t p-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map(img => {
              const isSelected = img.path === artifact.path
              return (
                <button
                  key={img.path}
                  type="button"
                  className={cn(
                    'shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all',
                    isSelected
                      ? 'border-primary shadow-md'
                      : 'border-transparent hover:border-muted'
                  )}
                  onClick={() => onSelect?.(img)}
                >
                  <ImageThumbnail artifact={img} />
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const PREVIEW_MIME_TYPES = ['xlsx', 'xls', 'doc', 'docx']

/**
 * 文件预览组件
 */
function FilePreview({ artifact }: { artifact: TaskArtifact }) {
  const { getArtifactUrl } = useNova()
  const [url, setUrl] = React.useState<string>('')
  const [loading, setLoading] = React.useState(true)

  // 检查是否是工具调用
  const isToolCall =
    artifact.event_type?.toLowerCase() === 'tool_call' ||
    artifact.file_type?.toLowerCase() === 'tool_call' ||
    artifact.file_type?.toLowerCase() === 'tool' ||
    !!artifact.tool_name

  // 检测工具类型
  const toolType = isToolCall ? detectToolType(artifact) : ToolType.OTHER

  const isMarkdown = artifact.file_type?.toLowerCase() === 'md' ||
    artifact.file_name?.toLowerCase().endsWith('.md')

  // 统一获取 URL
  React.useEffect(() => {
    if (artifact.path) {
      setLoading(true)
      getArtifactUrl?.(
        artifact,
        PREVIEW_MIME_TYPES.includes(artifact.file_type) ? {
          'x-oss-process': 'doc/preview,print_1,copy_1,export_1',
        } : undefined
      ).then(url => {
        if (PREVIEW_MIME_TYPES.includes(artifact.file_type)) {
          const shortUrl = url?.replace('.oss-cn-hangzhou.aliyuncs', '.betteryeah')
          if (shortUrl) {
            setUrl(shortUrl + `&x-oss-process=doc%2Fpreview%2Cprint_1%2Ccopy_1%2Cexport_1`)
          }
        } else {
          setUrl(url || '')
        }
        setLoading(false)
      }).catch(() => {
        setLoading(false)
      })
    }
  }, [artifact, getArtifactUrl])

  // 脚本执行：使用 ScriptPreview
  if (toolType === ToolType.SHELL_EXECUTE) {
    const outputText = extractShellOutput(artifact.tool_output)
    return (
      <ScriptPreview
        code={outputText}
        title="执行结果"
        language="bash"
        theme="one-light"
      />
    )
  }

  if (toolType === ToolType.SCRIPT_FILE) {
    const code = extractScriptCode(artifact.tool_input)
    const displayTitle = getDisplayTitle(artifact)
    return (
      <ScriptPreview
        code={code}
        title={displayTitle}
        language={undefined} // 自动检测
        theme="one-light"
      />
    )
  }

  // 其他工具调用：使用 ToolCallPreview
  if (isToolCall) {
    return (
      <ToolCallPreview
        toolName={artifact.tool_name}
        toolInput={artifact.tool_input}
        toolOutput={artifact.tool_output}
      />
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-muted-foreground">
        <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
        <span className="text-sm mt-2">加载中...</span>
      </div>
    )
  }

  // Markdown：用 URL fetch 内容后渲染
  if (isMarkdown && url) {
    return <MarkdownPreview url={url} />
  }

  // PPT：如果是 PPT 文件且有 slideList，使用 PPT 预览
  const isPpt = artifact.file_type?.toLowerCase() === 'ppt' ||
    artifact.file_type?.toLowerCase() === 'pptx' ||
    artifact.file_name?.toLowerCase().endsWith('.ppt') ||
    artifact.file_name?.toLowerCase().endsWith('.pptx')

  if (isPpt && url) {
    return <PptPreview url={url} />
  }

  if (url) {
    return (
      <iframe
        src={url}
        className="w-full h-full border-0"
        title={artifact.file_name}
      />
    )
  }

  // 不支持预览的文件类型
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-muted-foreground">
      <div className="text-6xl mb-4">📄</div>
      <div className="text-lg font-medium text-foreground mb-2">{artifact.file_name}</div>
      <div className="text-sm mb-4">
        {artifact.file_type?.toUpperCase() || '未知'} 文件
      </div>
      <p className="text-sm">此文件类型暂不支持预览</p>
    </div>
  )
}

/**
 * 文件预览组件
 */
export function ArtifactPreview({
  artifact,
  images = [],
  getUrl,
  onBack,
  onDownload,
  onClose,
  className,
}: ArtifactPreviewProps) {
  const [currentArtifact, setCurrentArtifact] = useState<TaskArtifact | null>(artifact)

  // 同步外部 artifact 变化
  React.useEffect(() => {
    setCurrentArtifact(artifact)
  }, [artifact])

  const handleImageSelect = useCallback((img: TaskArtifact) => {
    setCurrentArtifact(img)
  }, [])

  if (!currentArtifact) {
    return (
      <div className={cn('flex items-center justify-center h-full text-muted-foreground', className)}>
        请选择一个文件预览
      </div>
    )
  }

  // 判断是否是图片：检查 path、file_name 和 file_type
  const isImage =
    isImageFile(currentArtifact.path) ||
    isImageFile(currentArtifact.file_name) ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(currentArtifact.file_type?.toLowerCase() || '')

  return (
    <Card className={cn('flex flex-col h-full border-0 rounded-none', className)}>
      {/* 头部工具栏 */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b h-[50px] animate-in fade-in-0 slide-in-from-top-2 duration-300">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="transition-all hover:scale-110 hover:-translate-x-1"
            >
              <ChevronLeft className="w-5 h-5 transition-transform" />
            </Button>
          )}
          <span className="text-sm font-medium truncate max-w-[200px] animate-in fade-in-0 duration-300">
            {currentArtifact.file_name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onDownload && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDownload(currentArtifact)}
              title="下载"
              className="transition-all hover:scale-110 hover:bg-primary/10"
            >
              <Download className="w-5 h-5 transition-transform hover:translate-y-0.5" />
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              title="关闭面板"
              className="transition-all hover:scale-110"
            >
              <X className="w-4 h-4 transition-transform hover:rotate-90" />
            </Button>
          )}
        </div>
      </div>

      {/* 预览内容 */}
      <div className="flex-1 overflow-hidden">
        {isImage ? (
          <div className="animate-in fade-in-0 zoom-in-95 duration-300 h-full">
            <ImagePreview
              artifact={currentArtifact}
              images={images}
              getUrl={getUrl}
              onSelect={handleImageSelect}
            />
          </div>
        ) : (
          <div className="animate-in fade-in-0 zoom-in-95 duration-300 h-full">
            <FilePreview artifact={currentArtifact} />
          </div>
        )}
      </div>
    </Card>
  )
}
