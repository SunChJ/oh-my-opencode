"use client"

import { useState, useCallback } from 'react'
import type { TaskArtifact } from '../types'

export function usePanelState() {
  const [panelVisible, setPanelVisible] = useState(false)
  const [selectedAttachment, setSelectedAttachment] = useState<TaskArtifact | null>(null)

  const togglePanel = useCallback(() => {
    setPanelVisible((prev) => !prev)
  }, [])

  const openPanel = useCallback((attachment?: TaskArtifact) => {
    setPanelVisible(true)
    if (attachment) {
      setSelectedAttachment(attachment)
    }
  }, [])

  const closePanel = useCallback(() => {
    setPanelVisible(false)
    setSelectedAttachment(null)
  }, [])

  const selectAttachment = useCallback((attachment: TaskArtifact) => {
    setSelectedAttachment(attachment)
    setPanelVisible(true)
  }, [])

  return {
    panelVisible,
    selectedAttachment,
    togglePanel,
    openPanel,
    closePanel,
    selectAttachment,
  }
}
