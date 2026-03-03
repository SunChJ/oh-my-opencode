"use client"

import { useState, useEffect } from 'react'
import type { Element } from 'hast'
import { cn } from '@/utils/cn'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useHighlighter } from './useHighlighter'

export interface ScriptPreviewProps {
  /** 脚本代码 */
  code: string
  /** 执行结果 */
  output?: string
  /** 语言类型 */
  language?: string
  /** 脚本名称/标题 */
  title?: string
  /** 自定义类名 */
  className?: string
  /** 主题 */
  theme?: string
}

/**
 * 根据工具名称或内容检测语言
 */
function detectScriptLanguage(code: string, hint?: string): string {
  // 优先使用提示
  if (hint) {
    const lowerHint = hint.toLowerCase()
    if (lowerHint.includes('python') || lowerHint.includes('py')) return 'python'
    if (lowerHint.includes('javascript') || lowerHint.includes('js')) return 'javascript'
    if (lowerHint.includes('typescript') || lowerHint.includes('ts')) return 'typescript'
    if (lowerHint.includes('shell') || lowerHint.includes('bash') || lowerHint.includes('sh')) return 'bash'
    if (lowerHint.includes('sql')) return 'sql'
  }

  const trimmed = code.trim()

  // Python
  if (
    /^(def|class|import|from|if __name__|async def|@\w+)\s/.test(trimmed) ||
    /\bprint\s*\(/.test(trimmed)
  ) {
    return 'python'
  }

  // Bash/Shell
  if (
    /^(#!\/bin\/(bash|sh)|curl|wget|npm|yarn|cd|ls|echo|sudo)\s/.test(trimmed) ||
    /^\$\s/.test(trimmed)
  ) {
    return 'bash'
  }

  // JavaScript/Node
  if (
    /^(const|let|var|function|async|import|export)\s/.test(trimmed) ||
    /console\.(log|error|warn)/.test(trimmed)
  ) {
    return 'javascript'
  }

  // SQL
  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s/i.test(trimmed)) {
    return 'sql'
  }

  return 'plaintext'
}

/**
 * 代码块组件
 */
function CodeBlock({
  code,
  lang,
  theme = 'one-light',
}: {
  code: string
  lang: string
  theme?: string
  title?: string
}) {
  const highlighter = useHighlighter()
  const [highlightedHtml, setHighlightedHtml] = useState('')

  useEffect(() => {
    const generateHighlightedHtml = async () => {
      if (!highlighter || !code) {
        return ''
      }

      return highlighter.codeToHtml(code, {
        lang,
        theme,
        transformers: [
          {
            code(node: Element) {
              const className = node.properties.className
              if (Array.isArray(className)) {
                className.push('whitespace-pre-wrap', 'break-all')
              } else {
                node.properties.className = ['whitespace-pre-wrap', 'break-all']
              }
            },
            pre(node: Element) {
              node.tagName = 'div'
              const className = node.properties.className
              if (Array.isArray(className)) {
                className.push('overflow-auto')
              } else {
                node.properties.className = ['overflow-auto']
              }
              // 移除背景色
              delete node.properties.style
            },
          },
        ],
      })
    }

    generateHighlightedHtml().then(html => {
      setHighlightedHtml(html)
    })
  }, [code, lang, theme, highlighter])

  if (!highlightedHtml) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground bg-transparent rounded-lg">
        <div className="w-6 h-6 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="rounded-lg overflow-hidden bg-transparent">
      <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
    </div>
  )
}

/**
 * 脚本预览组件 - 专门用于显示脚本代码
 */
export function ScriptPreview({
  code,
  language,
  title = '脚本代码',
  className,
  theme = 'one-light',
}: Omit<ScriptPreviewProps, 'output'>) {
  const detectedLang = language || detectScriptLanguage(code, title)

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <ScrollArea className="flex-1">
        <div className="p-6">
          {/* 代码 - 直接显示 */}
          <CodeBlock code={code} lang={detectedLang} theme={theme} />
        </div>
      </ScrollArea>
    </div>
  )
}
