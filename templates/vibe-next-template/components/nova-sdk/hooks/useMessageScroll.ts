"use client"

import { useRef, useCallback } from 'react'
import type { MessageListRef } from '../message-list'

export function useMessageScroll() {
  const messageListRef = useRef<MessageListRef>(null)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messageListRef.current?.scrollToBottom(behavior)
  }, [])

  const scrollToBottomDelayed = useCallback((delay = 100, behavior: ScrollBehavior = 'smooth') => {
    setTimeout(() => {
      messageListRef.current?.scrollToBottom(behavior)
    }, delay)
  }, [])

  return {
    messageListRef,
    scrollToBottom,
    scrollToBottomDelayed,
  }
}
