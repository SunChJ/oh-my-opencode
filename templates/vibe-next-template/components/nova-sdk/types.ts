/**
 * Nova SDK Kit 组件类型定义
 */

export interface PlatformConfig {
  wssUrl: string
  apiBaseUrl: string
  token: string
  tenantId: string
}

// 事件类型常量
export enum EventType {
  UserInput = 'user_input',
  Message = 'message',
  ToolCall = 'tool_call',
  TaskUpdate = 'task_update',
  TaskEnd = 'task_end',
  Error = 'error',
}

// 任务状态常量
export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// API 返回的事件结构
export interface ApiEvent {
  event_id: string
  event_type?: string
  role?: 'user' | 'assistant' | 'system'
  content?: {
    text?: string
    content?: string
    tool_name?: string
    tool_input?: unknown
    tool_output?: unknown
    [key: string]: unknown
  }
  created_at?: string
  task_id?: string
  is_display?: boolean
  metadata?: {
    isUserInput?: boolean
    [key: string]: unknown
  }
  stream?: boolean
  event_status?: string
  [key: string]: unknown
}

// 消息内容
export interface MessageContent {
  content?: string
  text?: string
}

// 附件
export interface Attachment {
  file_id?: string
  file_name: string
  file_type: string
  file_url: string
  path?: string
}

// 图片附件
export interface ImageAttachment {
  url: string
  path?: string
  file_name?: string
}

// 上传文件
export interface UploadFile {
  uid: string
  name: string
  type: string
  byte_size?: number
  url?: string
  upload_file_id?: string
  progress?: number
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error'
}

// 扩展事件（用于渲染）
export interface ExtendedEvent extends ApiEvent {
  timestamp?: number
  metadata?: {
    isUserInput?: boolean
    isTemp?: boolean
    agent_id?: string
    [key: string]: unknown
  }
}

// 发送消息的 Payload
export interface SendMessagePayload {
  agent_id?: string
  content: string
  config?: {
    label_ids?: string[]
    search_custom_knowledge_enabled?: boolean
    template_type?: string
    template_id?: string
    brand_id?: string
    [key: string]: unknown
  }
  refer_content?: string
  upload_file_ids?: string[]
}

// Artifact 类型
export interface TaskArtifact {
  path: string
  file_name: string
  file_type: string
  last_modified?: number
  url?: string
  content?: string
  task_id?: string
  // 工具调用相关
  event_type?: string
  tool_name?: string
  tool_input?: unknown
  tool_output?: unknown
}
