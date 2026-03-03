"use client"

import { useState, useEffect } from 'react'
import type { Element } from 'hast'
import { cn } from '@/utils/cn'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useHighlighter } from './useHighlighter'

export interface ToolCallPreviewProps {
  /** 工具名称 */
  toolName?: string
  /** 工具输入参数 */
  toolInput?: unknown
  /** 工具输出结果 */
  toolOutput?: unknown
  /** 自定义类名 */
  className?: string
  /** 主题 */
  theme?: string
}

/**
 * 智能检测代码语言类型
 */
function detectLanguage(code: string, toolName?: string): string {
  const trimmed = code.trim()

  // 根据工具名称辅助判断
  if (toolName) {
    const lowerToolName = toolName.toLowerCase()
    if (lowerToolName.includes('python') || lowerToolName.includes('py_')) {
      return 'python'
    }
    if (lowerToolName.includes('javascript') || lowerToolName.includes('js_') || lowerToolName.includes('node')) {
      return 'javascript'
    }
    if (lowerToolName.includes('typescript') || lowerToolName.includes('ts_')) {
      return 'typescript'
    }
    if (lowerToolName.includes('shell') || lowerToolName.includes('bash') || lowerToolName.includes('sh_')) {
      return 'bash'
    }
    if (lowerToolName.includes('sql')) {
      return 'sql'
    }
  }

  // 检测 Python
  if (
    /^(def|class|import|from|if __name__|async def|@\w+)\s/.test(trimmed) ||
    /\bprint\s*\(/.test(trimmed) ||
    /:\s*$/.test(trimmed.split('\n')[0])
  ) {
    return 'python'
  }

  // 检测 Bash/Shell
  if (/^(#!\/bin\/(bash|sh)|curl|wget|npm|yarn|pnpm|cd|ls|mkdir|echo|sudo)\s/.test(trimmed)) {
    return 'bash'
  }

  // 检测 TypeScript
  if (
    /^(interface|type|enum)\s/.test(trimmed) ||
    /:\s*(string|number|boolean|any|void|unknown)/.test(trimmed)
  ) {
    return 'typescript'
  }

  // 检测 JavaScript/JSX
  if (
    /^(function|const|let|var|class|import|export|async)\s/.test(trimmed) ||
    /=>\s*{/.test(trimmed) ||
    /<[A-Z][\w]*[\s>]/.test(trimmed)
  ) {
    return 'javascript'
  }

  // 检测 HTML/XML
  if (/<[a-zA-Z][\s\S]*>/.test(trimmed)) {
    return 'html'
  }

  // 检测 CSS
  if (/^[.#]?[\w-]+\s*{/.test(trimmed) || /@(media|keyframes|import)/.test(trimmed)) {
    return 'css'
  }

  // 检测 SQL
  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s/i.test(trimmed)) {
    return 'sql'
  }

  // 检测 Markdown
  if (/^(#{1,6}\s|```|\*\*|__|\[.*\]\(.*\))/.test(trimmed)) {
    return 'markdown'
  }

  // 检测 Mermaid
  if (/^(graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie)\s/.test(trimmed)) {
    return 'mermaid'
  }

  // 检测 JSON (尝试解析)
  try {
    JSON.parse(code)
    return 'json'
  } catch {
    // 不是有效的 JSON
  }

  // 默认返回纯文本
  return 'plaintext'
}

/**
 * 从工具输入/输出中提取代码内容
 */
function extractCodeFromData(data: unknown): string | null {
  if (!data || typeof data !== 'object') {
    return null
  }

  const obj = data as Record<string, unknown>

  // 常见的代码字段
  const codeFields = [
    'code',
    'script',
    'command',
    'cmd',
    'content',
    'source',
    'text',
    'body',
  ]

  for (const field of codeFields) {
    if (typeof obj[field] === 'string' && obj[field]) {
      return obj[field] as string
    }
  }

  return null
}

/**
 * 格式化数据为字符串，尝试保持原始格式
 */
function formatData(data: unknown, toolName?: string): string {
  // 如果是字符串，直接返回
  if (typeof data === 'string') {
    return data
  }

  // 如果是脚本执行类工具，尝试提取代码
  const isCodeExecutionTool = toolName && (
    toolName.includes('execute') ||
    toolName.includes('shell') ||
    toolName.includes('code') ||
    toolName.includes('script') ||
    toolName.includes('python') ||
    toolName.includes('javascript') ||
    toolName.includes('node') ||
    toolName.includes('bash')
  )

  if (isCodeExecutionTool) {
    const code = extractCodeFromData(data)
    if (code) {
      return code
    }
  }

  // 默认格式化为 JSON
  return JSON.stringify(data, null, 2)
}

/**
 * 代码块组件 - 单个输入或输出
 */
function CodeBlock({
  code,
  lang,
  theme = 'github-dark-default',
}: {
  code: string
  lang: string
  theme?: string
}) {
  const highlighter = useHighlighter()
  const [highlightedHtml, setHighlightedHtml] = useState('')

  useEffect(() => {
    const generateHighlightedHtml = async () => {
      if (!highlighter || !code) {
        return code?.replace(/[\u00A0-\u9999<>&]/g, i => `&#${i.charCodeAt(0)};`) || ''
      }

      let processedCode = code
      let processedLang = lang

      // TypeScript 映射到 TSX
      if (processedLang === 'typescript') {
        processedLang = 'tsx'
      }

      // JSON 格式化
      if (processedLang === 'json') {
        try {
          const json = JSON.parse(processedCode)
          processedCode = JSON.stringify(json, null, 2)
        } catch {
          // 保持原样
        }
      }

      return highlighter.codeToHtml(processedCode, {
        lang: processedLang,
        theme,
        transformers: [
          {
            code(node: Element) {
              // 添加类名到 code 标签
              const className = node.properties.className
              if (Array.isArray(className)) {
                className.push('whitespace-break-spaces')
              } else {
                node.properties.className = ['whitespace-break-spaces']
              }
            },
            pre(node: Element) {
              // 移除 pre 标签，使用 div
              node.tagName = 'div'
              const className = node.properties.className
              if (Array.isArray(className)) {
                className.push('rounded-lg', 'overflow-hidden')
              } else {
                node.properties.className = ['rounded-lg', 'overflow-hidden']
              }
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
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div
      className="rounded-lg overflow-hidden border border-border bg-slate-950"
      dangerouslySetInnerHTML={{ __html: highlightedHtml }}
    />
  )
}

/**
 * 工具调用预览组件 - 使用 shiki 高亮显示工具调用的输入输出
 */
export function ToolCallPreview({
  toolName,
  toolInput,
  toolOutput,
  className,
  theme = 'github-dark-default',
}: ToolCallPreviewProps) {
  const inputCode = formatData(toolInput, toolName)
  const outputCode = formatData(toolOutput, toolName)

  const inputLang = detectLanguage(inputCode)
  const outputLang = detectLanguage(outputCode)

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* 工具名称 */}
          {toolName && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">工具调用</h3>
              <div className="inline-flex items-center px-3 py-1.5 rounded-md bg-primary/10 text-primary text-sm font-mono">
                {toolName}
              </div>
            </div>
          )}

          {/* 输入参数 */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
              输入参数
              <span className="text-xs text-muted-foreground font-mono">({inputLang})</span>
            </h4>
            <CodeBlock code={inputCode} lang={inputLang} theme={theme} />
          </div>

          {/* 输出结果 */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
              输出结果
              <span className="text-xs text-muted-foreground font-mono">({outputLang})</span>
            </h4>
            <CodeBlock code={outputCode} lang={outputLang} theme={theme} />
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
