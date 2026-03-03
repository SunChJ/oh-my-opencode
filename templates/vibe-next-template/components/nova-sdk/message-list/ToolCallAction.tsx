"use client"

import { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { Code, Terminal, Search, FileCode, Globe } from 'lucide-react'
import { ApiEvent } from '../types'

export interface ToolCallActionProps {
  name?: string
  arguments?: string[]
  action_type?: string
  event?: ApiEvent
  onClick?: (event: ApiEvent) => void
}

/**
 * 获取工具图标
 */
function getToolIcon(actionType?: string) {
  const iconMap: Record<string, ReactNode> = {
    shell_execute: <Terminal className="w-4 h-4" />,
    code_execute: <Code className="w-4 h-4" />,
    file_operator: <FileCode className="w-4 h-4" />,
    info_search_web: <Search className="w-4 h-4" />,
    web_fetch: <Globe className="w-4 h-4" />,
  }

  return iconMap[actionType || ''] || <Code className="w-4 h-4" />
}

/**
 * 工具调用 Action 组件
 */
export function ToolCallAction({ name, arguments: args, action_type, event, onClick }: ToolCallActionProps) {
  const icon = getToolIcon(action_type)
  const argsText = args?.join(' ') || ''

  const handleClick = () => {
    if (event && onClick) {
      onClick(event)
    }
  }

  const isClickable = !!(event && onClick)

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg max-w-full',
        'border border-border/50',
        'text-sm text-foreground',
        isClickable && 'cursor-pointer hover:bg-muted hover:border-border transition-colors'
      )}
      onClick={handleClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      } : undefined}
    >
      <div className="text-muted-foreground shrink-0">
        {icon}
      </div>
      {name && (
        <div className="font-medium shrink-0">{name}</div>
      )}
      {argsText && (
        <div className="text-muted-foreground truncate flex-1 min-w-0">
          {argsText}
        </div>
      )}
    </div>
  )
}

