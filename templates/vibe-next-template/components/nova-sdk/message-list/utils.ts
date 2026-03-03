import type { ExtendedEvent, Attachment, ImageAttachment } from '../types'

/**
 * 判断是否是用户输入
 */
export function isUserInput(event: ExtendedEvent): boolean {
  return event.event_type === 'user_input' || !!event.metadata?.isUserInput
}

/**
 * 提取文本内容
 */
export function extractText(obj: unknown): string {
  if (typeof obj === 'string') {
    return obj
  }
  if (obj && typeof obj === 'object') {
    const o = obj as Record<string, unknown>
    // 优先取 text 字段
    if (typeof o.text === 'string') {
      return o.text
    }
    // 递归处理嵌套的 content
    if (o.content) {
      return extractText(o.content)
    }
  }
  return ''
}

/**
 * 获取消息内容
 */
export function getMessageContent(event: ExtendedEvent): string {
  // 从 content 取
  if (event.content) {
    return extractText(event.content)
  }
  return ''
}

/** 图片文件扩展名 */
export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']

/**
 * 判断是否是图片文件
 */
export function isImageFile(path: string): boolean {
  const ext = path.split('.').pop()?.toLowerCase() || ''
  return IMAGE_EXTENSIONS.includes(ext)
}

/**
 * 从 content 中提取附件列表
 */
function extractAttachmentFiles(content: unknown): Array<{
  path: string
  file_name: string
  file_type: string
  desc?: string
  url?: string
}> {
  if (!content || typeof content !== 'object') return []
  const c = content as Record<string, unknown>

  // 尝试从 attachment_files 获取
  if (Array.isArray(c.attachment_files)) {
    return c.attachment_files
  }
  // 嵌套在 content 里
  if (c.content && typeof c.content === 'object') {
    return extractAttachmentFiles(c.content)
  }
  return []
}

/**
 * 获取附件列表（非图片文件）
 */
export function getAttachments(event: ExtendedEvent): Attachment[] {
  // 从 content.attachment_files 取
  const files = extractAttachmentFiles(event.content)
  return files
    .filter(f => !isImageFile(f.path || f.file_name))
    .map(f => ({
      file_id: f.path,
      file_name: f.file_name,
      file_type: f.file_type || f.file_name.split('.').pop() || '',
      file_url: f.url || f.path,
    }))
}

/**
 * 获取图片附件列表
 */
export function getImageAttachments(event: ExtendedEvent): ImageAttachment[] {
  // 从 content.attachment_files 取
  const files = extractAttachmentFiles(event.content)
  return files
    .filter(f => isImageFile(f.path || f.file_name))
    .map(f => ({
      url: f.url || f.path,
      file_name: f.file_name,
    }))
}

/**
 * 获取工具调用的 action 信息
 */
export function getToolCallAction(event: ExtendedEvent): {
  name?: string
  arguments?: string[]
  action_type?: string
} | null {
  if (event.event_type !== 'tool_call') {
    return null
  }

  const content = event.content as Record<string, unknown> | undefined
  if (!content) return null

  // 从 content 中提取 action 信息
  const actionName =
    (content.action_name as string) ||
    (content.action_type as string) ||
    ''

  const actionType =
    (content.tool_name as string) ||
    (content.action_type as string) ||
    ''

  // 提取 arguments
  let args: string[] = []
  if (Array.isArray(content.arguments)) {
    args = content.arguments as string[]
  } else if (typeof content.arguments === 'string') {
    try {
      const parsed = JSON.parse(content.arguments)
      if (Array.isArray(parsed)) {
        args = parsed
      }
    } catch {
      args = [content.arguments]
    }
  }

  if (!actionName && !actionType) {
    return null
  }

  return {
    name: actionName,
    arguments: args,
    action_type: actionType,
  }
}

/**
 * 获取计划步骤状态
 */
export function getPlanStepState(event: ExtendedEvent): string | null {
  // plan_step_state 与 event_status 同级，在事件对象的顶层
  const e = event as ExtendedEvent & { plan_step_state?: string }
  return e.plan_step_state || null
}
