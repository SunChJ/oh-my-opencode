"use client"

import { useEffect, useState } from "react";

export function useBuildConversationConnect() {
  const [agentId, setAgentId] = useState<string>()
  const [conversationId, setConversationId] = useState<string>('')
  const [platformConfig, setPlatformConfig] = useState({
    wssUrl: '',
    apiBaseUrl: '',
    token: '',
    tenantId: '',
  })

  useEffect(() => {
    fetch('/api/info').then(res => res.json()).then(res => {
      setAgentId(res.data.agent_id)
      setConversationId(res.data.conversation_id)

      setPlatformConfig({
        wssUrl: res.data.wssUrl,
        apiBaseUrl: res.data.apiBaseUrl,
        token: res.data.token,
        tenantId: res.data.tenantId,
      })
    })
  }, [])

  return {
    agentId,
    conversationId,
    platformConfig,
  }
}