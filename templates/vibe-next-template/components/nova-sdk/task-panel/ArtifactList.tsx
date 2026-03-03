"use client"

import React, { useMemo, useState } from 'react'
import { cn } from '@/utils/cn'
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { TaskArtifact } from '../types'

export interface ArtifactListProps {
  /** 文件列表 */
  artifacts: TaskArtifact[]
  /** 点击文件回调 */
  onClick?: (artifact: TaskArtifact) => void
  /** 当前选中的文件 */
  selected?: TaskArtifact | null
  /** 自定义类名 */
  className?: string
}

// 文件图标映射
const FILE_ICONS: Record<string, string> = {
  jpg: '🖼️',
  jpeg: '🖼️',
  png: '🖼️',
  gif: '🖼️',
  webp: '🖼️',
  svg: '🖼️',
  pdf: '📄',
  doc: '📝',
  docx: '📝',
  xls: '📊',
  xlsx: '📊',
  ppt: '📽️',
  pptx: '📽️',
  mp4: '🎬',
  mov: '🎬',
  mp3: '🎵',
  m4a: '🎵',
  txt: '📃',
  md: '📃',
  html: '🌐',
  json: '📋',
  default: '📁',
}

/**
 * 获取文件图标
 */
function getFileIcon(fileType: string): string {
  return FILE_ICONS[fileType.toLowerCase()] || FILE_ICONS.default
}

// 文件树节点类型
interface TreeNode {
  name: string
  path: string
  isFolder: boolean
  children?: TreeNode[]
  artifact?: TaskArtifact
  depth: number
}

interface BuildNode extends Omit<TreeNode, 'children'> {
  children?: Record<string, BuildNode>
}

/**
 * 将文件列表转换为树形结构
 */
function buildFileTree(artifacts: TaskArtifact[]): TreeNode[] {
  const root: Record<string, BuildNode> = {}

  artifacts.forEach(artifact => {
    // 使用 path 或 file_name 来构建路径
    const fullPath = artifact.path || artifact.file_name
    const parts = fullPath.split('/').filter(p => p)

    let currentLevel = root
    let currentPath = ''

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part
      const isLastPart = index === parts.length - 1

      if (!currentLevel[part]) {
        currentLevel[part] = {
          name: part,
          path: currentPath,
          isFolder: !isLastPart,
          children: isLastPart ? undefined : {},
          artifact: isLastPart ? artifact : undefined,
          depth: index,
        }
      }

      if (!isLastPart && currentLevel[part].children) {
        currentLevel = currentLevel[part].children!
      }
    })
  })

  // 将对象转换为数组并排序（文件夹在前，文件在后）
  const convertToArray = (obj: Record<string, BuildNode>): TreeNode[] => {
    return Object.values(obj)
      .map(node => ({
        ...node,
        children: node.children ? convertToArray(node.children) : undefined,
      }) as TreeNode)
      .sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1
        if (!a.isFolder && b.isFolder) return 1
        return a.name.localeCompare(b.name)
      })
  }

  return convertToArray(root)
}

/**
 * 文件树节点组件 - 支持文件夹和文件
 */
function TreeNodeItem({
  node,
  onClick,
  selectedPath,
  expandedFolders,
  onToggleFolder,
  depth = 0,
}: {
  node: TreeNode
  onClick?: (artifact: TaskArtifact) => void
  selectedPath?: string
  expandedFolders: Set<string>
  onToggleFolder: (path: string) => void
  depth?: number
}) {
  const isExpanded = expandedFolders.has(node.path)
  const isSelected = !node.isFolder && node.artifact?.path === selectedPath
  const hasChildren = node.children && node.children.length > 0

  const handleClick = () => {
    if (node.isFolder) {
      onToggleFolder(node.path)
    } else if (node.artifact) {
      onClick?.(node.artifact)
    }
  }

  return (
    <div>
      {/* 当前节点 */}
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer',
          'transition-all duration-200 ease-in-out',
          'hover:bg-accent/50',
          !node.isFolder && isSelected && 'bg-accent'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        {/* 展开/折叠图标（仅文件夹） */}
        {node.isFolder && hasChildren && (
          <div className="w-4 h-4 flex items-center justify-center shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </div>
        )}

        {/* 文件夹图标 */}
        {node.isFolder ? (
          <div className="shrink-0">
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-yellow-500" />
            ) : (
              <Folder className="w-4 h-4 text-yellow-500" />
            )}
          </div>
        ) : (
          <span className="text-base shrink-0">
            {getFileIcon(node.artifact?.file_type || '')}
          </span>
        )}

        {/* 名称 */}
        <span
          className={cn(
            'text-sm truncate flex-1',
            node.isFolder && 'font-medium',
            !node.isFolder && isSelected && 'text-accent-foreground font-medium'
          )}
        >
          {node.name}
        </span>
      </div>

      {/* 子节点（展开时显示） */}
      {node.isFolder && isExpanded && hasChildren && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          {node.children?.map((child) => (
            <TreeNodeItem
              key={child.path}
              node={child}
              onClick={onClick}
              selectedPath={selectedPath}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * 文件列表组件 - 支持文件夹结构
 */
export function ArtifactList({
  artifacts,
  onClick,
  selected,
  className,
}: ArtifactListProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  // 过滤并构建文件树
  const tree = useMemo(() => {
    const filtered = artifacts.filter(artifact => artifact.event_type !== 'tool_call')
    return buildFileTree(filtered)
  }, [artifacts])

  // 切换文件夹展开/折叠状态
  const handleToggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }

  if (artifacts.length === 0 || tree.length === 0) {
    return (
      <div className={cn('p-4 text-center text-muted-foreground', className)}>
        暂无文件
      </div>
    )
  }

  return (
    <ScrollArea className={cn('flex flex-col gap-2 p-3', className)}>
      <div className="space-y-0.5">
        {tree.map((node) => (
          <TreeNodeItem
            key={node.path}
            node={node}
            onClick={onClick}
            selectedPath={selected?.path}
            expandedFolders={expandedFolders}
            onToggleFolder={handleToggleFolder}
            depth={0}
          />
        ))}
      </div>
    </ScrollArea>
  )
}
