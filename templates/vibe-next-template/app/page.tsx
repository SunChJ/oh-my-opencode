"use client"

import { NovaChat } from '@/components/nova-sdk/nova-chat';
import { useBuildConversationConnect } from '@/components/nova-sdk/hooks/useBuildConversationConnect';

export default function Home() {
  const { agentId, conversationId, platformConfig } = useBuildConversationConnect()

  if (!agentId || !conversationId || !platformConfig) {
    return <div>Loading...</div>
  }

  return (
    <div className="h-screen">
      <NovaChat agentId={agentId} conversationId={conversationId} platformConfig={platformConfig} />
    </div>
  );
}
