import { ApiEvent, PlatformConfig } from '../types'
import { useNovaEvents } from './useNovaEvents'
import { usePanelState } from './usePanelState'
import { useAttachmentHandlers } from './useAttachmentHandlers'
import { useMessageSender } from './useMessageSender'
import { useNovaService } from './useNovaService'

export interface UseNovaChatLogicProps {
  agentId: string
  conversationId: string
  platformConfig: PlatformConfig
  reconnectLimit?: number
  reconnectInterval?: number
  getToken?: () => string | undefined
  getTenantId?: () => string | undefined
  onEvent?: (event: ApiEvent) => void
  onError?: (error: Error) => void
}

/**
 * Nova Chat 主业务逻辑 Hook
 * 采用原子化模块组合模式，提高代码鲁棒性和可维护性
 */
export function useNovaChatLogic({
  agentId,
  conversationId,
  platformConfig,
  reconnectLimit = 3,
  reconnectInterval = 3000,
  onEvent,
  onError,
}: UseNovaChatLogicProps) {
  // api
  const apiClient = useNovaService({ platformConfig })

  // 1. 核心事件与连接管理
  const { sendMessage } = useNovaEvents({
    apiClient,
    conversationId,
    platformConfig,
    reconnectLimit,
    reconnectInterval,
    onEvent,
    onError,
  })

  // 2. 面板与附件状态管理
  const {
    panelVisible,
    selectedAttachment,
    togglePanel,
    closePanel,
    selectAttachment
  } = usePanelState()

  // 3. 附件操作处理器
  const {
    handleAttachmentClick,
    handleImageAttachmentClick,
    handleToolCallClick
  } = useAttachmentHandlers(selectAttachment)

  // 4. 消息发送逻辑
  const { sendingMessage, handleSend, setSendingMessage } = useMessageSender({
    agentId,
    conversationId,
    platformConfig,
    sendMessage,
  })

  // 6. 统一对外接口
  return {
    // 统一的 API 命名空间
    apiClient,

    loading: sendingMessage,
    panelVisible,
    selectedAttachment,

    // 操作方法
    handleSend,
    handlePanelToggle: togglePanel,
    handlePanelClose: closePanel,
    handleAttachmentClick,
    handleImageAttachmentClick,
    handleToolCallClick,
    setLoading: setSendingMessage,
  }
}
