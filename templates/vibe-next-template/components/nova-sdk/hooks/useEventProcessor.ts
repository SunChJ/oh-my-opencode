"use client"

import { useMemo, useCallback } from 'react'
import type { ApiEvent, ExtendedEvent } from '../types'
import { processSlideEvents, attachSlideMetadata } from '../utils/slideEventHelpers'

/**
 * 将 API 返回的事件转换为 ExtendedEvent 格式
 */
export function useEventConverter() {
  return useCallback((event: ApiEvent): ExtendedEvent => {
    const isUserInput = event.event_type === 'user_input' || event.role === 'user'

    // 从 ApiEvent 中提取 plan_step_state（与 event_id、event_type 同级）
    const apiEventWithState = event as ApiEvent & { plan_step_state?: string }

    return {
      event_id: event.event_id,
      event_type: event.event_type || 'message',
      timestamp: event.created_at ? new Date(event.created_at).getTime() : Date.now(),
      content: {
        text: event.content?.text || event.content?.content || '',
        ...event.content,
      },
      metadata: {
        ...event.metadata,
        isUserInput,
        task_id: event.task_id,
        role: event.role,
      },
      // 保留 plan_step_state 字段
      ...(apiEventWithState.plan_step_state && { plan_step_state: apiEventWithState.plan_step_state }),
    }
  }, [])
}

/**
 * 处理原始事件数据，合并流式事件
 */
export function useEventProcessor(rawEvents: ApiEvent[]) {
  const convertEventToExtendedEvent = useEventConverter()

  return useMemo(() => {
    // 如果没有原始数据，返回空数组
    if (!rawEvents || rawEvents.length === 0) {
      return [[] as ExtendedEvent[]]
    }

    // 按 event_id 去重，流式事件保留最新的（替换逻辑）
    const eventsMap = new Map<string, ApiEvent>()

    for (const event of rawEvents) {
      const eventId = event.event_id
      const isStream = !!event.stream

      // 流式事件：替换同一个 event_id 的事件
      if (isStream) {
        const index = eventsMap.has(eventId) ? 1 : -1
        if (index === -1) {
          eventsMap.set(eventId, event)
        } else {
          eventsMap.set(eventId, event) // 替换
        }
      } else {
        // 非流式事件
        if (!eventsMap.has(eventId)) {
          eventsMap.set(eventId, event)
        } else {
          eventsMap.set(eventId, event) // 替换
        }
      }
    }

    // 处理 slide 事件的流式数据
    const slideData = processSlideEvents(rawEvents)

    // 转换为数组并过滤
    const displayEvents = Array.from(eventsMap.values())
      .filter((event) => event.is_display !== false)
      .map((event) => {
        const extEvent = convertEventToExtendedEvent(event)

        // 如果是 slide 事件，附加合并后的数据
        const slideMetadata = attachSlideMetadata(event, slideData)
        if (slideMetadata) {
          extEvent.metadata = {
            ...extEvent.metadata,
            slide: slideMetadata,
          }
        }

        return extEvent
      })

    // 按时间排序
    displayEvents.sort((a: ExtendedEvent, b: ExtendedEvent) => (a.timestamp || 0) - (b.timestamp || 0))

    return [displayEvents]
  }, [rawEvents, convertEventToExtendedEvent])
}
