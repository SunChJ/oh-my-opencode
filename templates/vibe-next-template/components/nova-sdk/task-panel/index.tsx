"use client"

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import type { TaskArtifact } from '../types'
import { ArtifactList } from './ArtifactList'
import { isImageFile } from './utils'
import { ArtifactPreview } from './ArtifactPreview'
import { useNovaStore } from '../store/useNovaStore'

export interface TaskPanelProps {
  /** 文件列表 */
  artifacts: TaskArtifact[]
  /** 是否可见 */
  visible?: boolean
  /** 面板宽度 */
  width?: number | string
  /** 获取文件 URL 的函数 */
  getUrl?: (artifact: TaskArtifact) => string | Promise<string>
  /** 下载文件回调 */
  onDownload?: (artifact: TaskArtifact) => void
  /** 关闭面板回调 */
  onClose?: () => void
  /** 自定义类名 */
  className?: string
  /** 初始选中的文件 */
  initialSelected?: TaskArtifact | null
}

/**
 * 任务面板组件 - 展示图片和文件
 */
export function TaskPanel({
  artifacts: artifactsProp,
  visible = true,
  width = '50%',
  getUrl,
  onDownload,
  onClose,
  className,
  initialSelected,
}: TaskPanelProps) {
  const [selectedArtifact, setSelectedArtifact] = useState<TaskArtifact | null>(initialSelected || null)

  // 从 store 获取 events 和 artifacts
  const events = useNovaStore((state) => state.events)
  const artifactsFromStore = useNovaStore((state) => state.artifacts)

  // 将 tool_call 类型的 events 转换为 artifacts
  const toolCallArtifacts = useMemo((): TaskArtifact[] => {
    return events
      .filter((event) => event.event_type === 'tool_call')
      .map((event) => ({
        path: event.event_id,
        file_name: (event.content?.tool_name as string) || '工具调用',
        file_type: 'tool_call',
        event_type: 'tool_call',
        tool_name: event.content?.tool_name as string | undefined,
        tool_input: event.content?.tool_input,
        tool_output: event.content?.tool_output,
      } as TaskArtifact))
  }, [events])

  // 合并所有 artifacts：优先使用 store 中的，然后是 props 传入的，最后是 tool_call
  const allArtifacts = useMemo(() => {
    // 如果 store 中有数据，优先使用 store
    const baseArtifacts = artifactsFromStore.length > 0 ? artifactsFromStore : artifactsProp
    return [...baseArtifacts, ...toolCallArtifacts]
  }, [artifactsFromStore, artifactsProp, toolCallArtifacts])

  useEffect(() => {
    if (initialSelected) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedArtifact(initialSelected)
    } else if (allArtifacts.length === 1) {
      setSelectedArtifact(allArtifacts[0])
    }
  }, [initialSelected, allArtifacts])

  // 筛选出所有图片
  const images = useMemo(() => {
    return allArtifacts.filter(a => isImageFile(a.path))
  }, [allArtifacts])

  // 选择文件
  const handleSelect = useCallback((artifact: TaskArtifact) => {
    setSelectedArtifact(artifact)
  }, [])

  // 返回列表
  const handleBack = useCallback(() => {
    setSelectedArtifact(null)
  }, [])

  return (
    <Card
      className={cn(
        'h-full flex flex-col border-l rounded-none',
        'transition-all duration-300 ease-in-out',
        visible
          ? 'animate-in slide-in-from-right-full fade-in-0'
          : 'animate-out slide-out-to-right-full fade-out-0',
        className
      )}
      style={{ width }}
    >
      {/* 头部 */}
      {!selectedArtifact && allArtifacts.length !== 1 && (
        <CardHeader className="flex-row items-center justify-between py-3 px-4 border-b space-y-0 animate-in fade-in-0 slide-in-from-top-2 duration-300">
          <CardTitle className="text-sm font-medium">文件列表</CardTitle>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 transition-all hover:scale-110 hover:bg-destructive/10"
              onClick={onClose}
              title="关闭面板"
            >
              <X className="w-4 h-4 transition-transform hover:rotate-90" />
            </Button>
          )}
        </CardHeader>
      )}

      {/* 内容区 */}
      <div className="flex-1 overflow-hidden relative">
        {selectedArtifact || (allArtifacts.length === 1 && allArtifacts[0]) ? (
          <div className="absolute inset-0 animate-in fade-in-0 slide-in-from-right-4 duration-300">
            <ArtifactPreview
              artifact={selectedArtifact || allArtifacts[0]}
              images={images}
              getUrl={getUrl}
              onBack={allArtifacts.length > 1 ? handleBack : undefined}
              onDownload={onDownload}
              onClose={onClose}
            />
          </div>
        ) : (
          <div className="absolute inset-0 animate-in fade-in-0 slide-in-from-left-4 duration-300">
            <ArtifactList
              artifacts={allArtifacts}
              onClick={handleSelect}
              selected={selectedArtifact}
              className="h-full"
            />
          </div>
        )}
      </div>
    </Card>
  )
}
