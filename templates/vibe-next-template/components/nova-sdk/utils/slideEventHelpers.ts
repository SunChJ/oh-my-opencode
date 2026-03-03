import { ApiEvent } from '../types'

/**
 * 检查是否为 slide_create_in_batches 事件
 */
export function isSlideCreateInBatchesEvent(
  event: ApiEvent,
  state?: 'start' | 'running' | 'done'
): boolean {
  if (event.content?.action_type !== 'slide_create_in_batches') {
    return false
  }
  if (!state) return true

  const eventStatus = event.event_status as string | undefined
  const isStream = !!event.stream

  if (state === 'start') return !isStream && eventStatus === 'running'
  if (state === 'running') return isStream && eventStatus === 'running'
  if (state === 'done') return eventStatus === 'success'
  return false
}

/**
 * Slide 流式数据累积结果
 */
export interface SlideStreamData {
  slideChunks: Map<string, string>
  slidePages?: Array<{ html: string; status: 'completed' }>
}

/**
 * 处理 slide 事件的流式数据累积
 */
export function processSlideEvents(rawEvents: ApiEvent[]): SlideStreamData {
  const slideChunks = new Map<string, string>() // index -> content
  let slidePages: Array<{ html: string; status: 'completed' }> | undefined

  for (const event of rawEvents) {
    // slide_create_in_batches 特殊处理：累积 chunks
    if (isSlideCreateInBatchesEvent(event, 'running')) {
      const chunk = event.content?.tool_input as { index?: number; content?: string } | undefined
      if (chunk?.content) {
        const key = (chunk.index || 1).toString()
        const existing = slideChunks.get(key) || ''
        slideChunks.set(key, existing + chunk.content)
      }
    }

    if (isSlideCreateInBatchesEvent(event, 'done')) {
      const output = event.content?.tool_output as { generated_files?: Array<{ index: number; content: string }> } | undefined
      if (output?.generated_files) {
        slidePages = output.generated_files.map((slide) => ({
          html: slide.content,
          status: 'completed' as const,
        }))
      }
    }
  }

  return { slideChunks, slidePages }
}

/**
 * 为事件附加 slide 元数据
 */
export function attachSlideMetadata(
  event: ApiEvent,
  slideData: SlideStreamData
): { pages?: Array<{ html: string; status: 'running' | 'completed' }>; isStreaming: boolean } | undefined {
  if (!isSlideCreateInBatchesEvent(event)) {
    return undefined
  }

  const { slideChunks, slidePages } = slideData

  const streamPages = slideChunks.size > 0
    ? Array.from(slideChunks.entries())
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, content]) => ({ html: content, status: 'running' as const }))
    : undefined

  return {
    pages: slidePages || streamPages,
    isStreaming: !slidePages && !!streamPages,
  }
}
