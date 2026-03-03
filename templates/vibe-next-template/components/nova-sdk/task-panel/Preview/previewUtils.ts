import type { TaskArtifact } from '../../types'

/**
 * 工具类型枚举
 */
export enum ToolType {
  SHELL_EXECUTE = 'shell_execute',
  SCRIPT_FILE = 'script_file',
  OTHER = 'other',
}

/**
 * 脚本文件扩展名
 */
const SCRIPT_EXTENSIONS = ['py', 'js', 'ts', 'sh', 'bash', 'zsh', 'fish', 'rb', 'php', 'go', 'rs', 'java', 'kt', 'swift']

/**
 * 从路径中提取文件扩展名
 */
export function getFileExtension(path?: string): string {
  if (!path) return ''
  const match = path.match(/\.([^.]+)$/)
  return match ? match[1].toLowerCase() : ''
}

/**
 * 从 tool_input 中提取 file_path
 */
export function getFilePathFromInput(input: unknown): string {
  try {
    let obj: Record<string, unknown> | null = null
    if (typeof input === 'string') {
      obj = JSON.parse(input)
    } else if (input && typeof input === 'object') {
      obj = input as Record<string, unknown>
    }
    if (obj && typeof obj.file_path === 'string') {
      return obj.file_path
    }
  } catch {
    // ignore
  }
  return ''
}

/**
 * 判断工具类型
 */
export function detectToolType(artifact: TaskArtifact): ToolType {
  const toolName = artifact.tool_name

  // 1. shell_execute 特殊处理
  if (toolName === 'shell_execute') {
    return ToolType.SHELL_EXECUTE
  }

  // 2. 检查文件扩展名
  const filePath = getFilePathFromInput(artifact.tool_input)
  const fileExt = getFileExtension(filePath) || getFileExtension(artifact.path) || getFileExtension(artifact.file_name)

  if (SCRIPT_EXTENSIONS.includes(fileExt)) {
    return ToolType.SCRIPT_FILE
  }

  // 3. 检查工具名称关键字
  if (toolName && (
    toolName.toLowerCase().includes('execute') ||
    toolName.toLowerCase().includes('shell') ||
    toolName.toLowerCase().includes('code') ||
    toolName.toLowerCase().includes('script') ||
    toolName.toLowerCase().includes('python') ||
    toolName.toLowerCase().includes('javascript') ||
    toolName.toLowerCase().includes('node') ||
    toolName.toLowerCase().includes('bash') ||
    toolName.toLowerCase().includes('cmd')
  )) {
    return ToolType.SCRIPT_FILE
  }

  return ToolType.OTHER
}

/**
 * 移除 ANSI 转义序列
 */
export function removeAnsiCodes(text: string): string {

  return text.replace(/\x1b\[[0-9;]*m/g, '')
}

/**
 * 从数据中提取字符串
 */
function extractFromObject(data: unknown, fields: string[]): string | null {
  let obj: Record<string, unknown> | null = null

  // 解析 JSON 字符串
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data)
      if (parsed && typeof parsed === 'object') {
        obj = parsed
      } else if (typeof parsed === 'string') {
        return parsed
      }
    } catch {
      return data
    }
  } else if (data && typeof data === 'object') {
    obj = data as Record<string, unknown>
  }

  // 从对象中提取字段
  if (obj) {
    for (const field of fields) {
      const value = obj[field]
      if (typeof value === 'string' && value) {
        return value
      }
    }
  }

  return null
}

/**
 * 提取 shell_execute 输出
 */
export function extractShellOutput(output: unknown): string {
  // 处理数组
  if (Array.isArray(output)) {
    if (output.length === 1 && typeof output[0] === 'string') {
      return removeAnsiCodes(output[0])
    }
    return removeAnsiCodes(output.filter(item => typeof item === 'string').join('\n'))
  }

  // 解析 JSON
  if (typeof output === 'string') {
    try {
      const parsed = JSON.parse(output)
      if (Array.isArray(parsed)) {
        if (parsed.length === 1 && typeof parsed[0] === 'string') {
          return removeAnsiCodes(parsed[0])
        }
        return removeAnsiCodes(parsed.filter(item => typeof item === 'string').join('\n'))
      }
    } catch {
      return removeAnsiCodes(output)
    }
  }

  // 从对象中提取
  const result = extractFromObject(output, ['output', 'result', 'stdout'])
  if (result) {
    return removeAnsiCodes(result)
  }

  return JSON.stringify(output, null, 2)
}

/**
 * 提取脚本代码
 */
export function extractScriptCode(input: unknown): string {
  const codeFields = [
    'file_content',
    'content',
    'code',
    'script',
    'command',
    'cmd',
    'source',
    'text',
    'body',
  ]

  const result = extractFromObject(input, codeFields)
  return result || JSON.stringify(input, null, 2)
}

/**
 * 获取显示标题
 */
export function getDisplayTitle(artifact: TaskArtifact): string {
  const filePath = getFilePathFromInput(artifact.tool_input)
  return filePath || artifact.file_name || artifact.tool_name || '未命名'
}
