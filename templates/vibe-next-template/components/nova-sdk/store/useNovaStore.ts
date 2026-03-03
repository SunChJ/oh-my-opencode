import { create } from 'zustand'
import { ApiEvent, TaskStatus, type TaskArtifact } from '../types'
import { ReadyState } from '../websocket'

export interface NovaStoreState {
  loading: boolean
  setLoading: (loading: boolean) => void

  ws: {
    connected: boolean
    readyState: ReadyState
  }
  setWSState: (connected: boolean, readyState: ReadyState) => void

  agentId: string
  conversationId: string
  messageSending: boolean
  init: (agentId: string, conversationId: string) => void
  destroy: () => void

  status: TaskStatus
  /** 所有事件 */
  events: ApiEvent[]
  /** 所有 artifacts（文件和工具调用） */
  artifacts: TaskArtifact[]
  /** 选中的事件（用于预览） */
  selectedEvent: ApiEvent | null

  /** 设置事件列表 */
  setEvents: (events: ApiEvent[]) => void
  updateEvent: (event: ApiEvent) => void
  /** 选中一个事件 */
  selectEvent: (event: ApiEvent | null) => void
  /** 设置 artifacts 列表 */
  setArtifacts: (artifacts: TaskArtifact[]) => void
  /** 设置消息发送状态 */
  setMessageSending: (sending: boolean) => void
  /** 清空所有数据 */
  reset: () => void
}

/**
 * Nova 状态管理 Store
 */
export const useNovaStore = create<NovaStoreState>((set) => ({
  loading: false,
  setLoading: (loading) => set({ loading }),

  ws: {
    connected: false,
    readyState: ReadyState.Closed,
  },
  setWSState: (connected, readyState) => set({ ws: { connected, readyState } }),

  agentId: '',
  conversationId: '',
  init: (agentId, conversationId) => {
    set({ agentId, conversationId })
  },
  destroy: () => set({ agentId: '', conversationId: '', messageSending: false, events: [], artifacts: [], selectedEvent: null }),

  messageSending: false,
  status: TaskStatus.PENDING,
  events: [],
  artifacts: [],
  selectedEvent: null,

  setEvents: (events) => {
    const eventsMap = new Map<string, ApiEvent>()

    // unique by event_id
    for (const event of events) {
      eventsMap.set(event.event_id, event)
    }
    set({ events: Array.from(eventsMap.values()) })

    const { artifacts, status } = getArtifactsFromEvents(events)
    set({ artifacts, status })
  },
  updateEvent: (newEvent) => {
    const prev = useNovaStore.getState().events
    const index = prev.findIndex((e) => e.event_id === newEvent.event_id)
    if (index === -1) {
      set({ events: [...prev, newEvent] })
      return
    }
    const updated = [...prev]
    updated[index] = newEvent
    set({ events: updated })
  },
  selectEvent: (event) => set({ selectedEvent: event }),
  setArtifacts: (artifacts) => set({ artifacts }),
  setMessageSending: (sending) => set({ messageSending: sending }),
  reset: () => set({ status: TaskStatus.PENDING, events: [], artifacts: [], selectedEvent: null, }),
}))

const getArtifactsFromEvents = (events: ApiEvent[]): { artifacts: TaskArtifact[]; status: TaskStatus } => {
  const artifacts: TaskArtifact[] = []
  const artifactKeys = new Set<string>() // 用于去重
  let status: TaskStatus = TaskStatus.PENDING

  for (const event of events) {
    const content = event.content as Record<string, unknown> | undefined
    if (!content) continue

    // 1. 提取 attachments
    if (content.attachments) {
      const attachments = Array.isArray(content.attachments)
        ? content.attachments
        : [content.attachments]

      for (const att of attachments) {
        if (att?.file_name) {
          const key = att.file_url || att.file_id || att.path || att.file_name
          if (!artifactKeys.has(key)) {
            artifactKeys.add(key)
            artifacts.push({
              path: att.path || att.file_url || att.file_id || '',
              file_name: att.file_name,
              file_type: att.file_type || att.file_name.split('.').pop() || '',
              url: att.file_url,
            })
          }
        }
      }
    }

    // 2. 提取 attachment_files
    if (content.attachment_files && Array.isArray(content.attachment_files)) {
      for (const file of content.attachment_files) {
        if (file?.file_name) {
          const key = file.url || file.path || file.file_name
          if (!artifactKeys.has(key)) {
            artifactKeys.add(key)
            artifacts.push({
              path: file.path || file.url || '',
              file_name: file.file_name,
              file_type: file.file_type || file.file_name.split('.').pop() || '',
              url: file.url,
            })
          }
        }
      }
    }

    // 3. 提取 generated_files (如 slide_create_in_batches 的输出)
    const toolOutput = content.tool_output as Record<string, unknown> | undefined
    if (toolOutput?.generated_files && Array.isArray(toolOutput.generated_files)) {
      for (const file of toolOutput.generated_files) {
        if (file?.index !== undefined && file?.content) {
          const fileName = `slide_${file.index}.html`
          const key = `generated_${event.event_id}_${file.index}`
          if (!artifactKeys.has(key)) {
            artifactKeys.add(key)
            artifacts.push({
              path: key,
              file_name: fileName,
              file_type: 'html',
              event_type: 'generated_file',
              tool_output: file.content,
            })
          }
        }
      }
    }

    // 4. 提取 files (其他可能的文件字段)
    if (content.files && Array.isArray(content.files)) {
      for (const file of content.files) {
        if (file?.name || file?.file_name) {
          const fileName = file.name || file.file_name
          const key = file.url || file.path || file.id || fileName
          if (!artifactKeys.has(key)) {
            artifactKeys.add(key)
            artifacts.push({
              path: file.path || file.url || file.id || '',
              file_name: fileName,
              file_type: file.type || file.file_type || fileName.split('.').pop() || '',
              url: file.url,
            })
          }
        }
      }
    }

    // 提取 taskStatus
    const eventStatus = event.event_status as string | undefined
    if (eventStatus === 'running' || eventStatus === 'in_progress') {
      status = TaskStatus.IN_PROGRESS
    } else if (eventStatus === 'success' || eventStatus === 'completed') {
      status = TaskStatus.COMPLETED
    } else if (eventStatus === 'failed' || eventStatus === 'error') {
      status = TaskStatus.FAILED
    }
  }

  return { artifacts, status }
}