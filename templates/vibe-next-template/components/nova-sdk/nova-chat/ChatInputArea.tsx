import { LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MessageInput } from '../message-input'
import type { SendMessagePayload } from '../types'

export interface ChatInputAreaProps {
  /** 输入框占位符 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 发送消息回调 */
  onSend: (payload: SendMessagePayload) => void
  /** 是否有工件（决定是否显示面板切换按钮） */
  hasArtifacts: boolean
  /** 面板是否可见 */
  panelVisible: boolean
  /** 面板切换回调 */
  onPanelToggle: () => void
}

export function ChatInputArea({
  placeholder,
  disabled,
  onSend,
  hasArtifacts,
  panelVisible,
  onPanelToggle
}: ChatInputAreaProps) {
  return (
    <div className="shrink-0 p-4 border-t bg-background">
      <div className="mx-auto flex items-center gap-3">
        <div className="flex-1 w-[90%] mx-auto">
          <MessageInput
            placeholder={placeholder}
            disabled={disabled}
            onSend={onSend}
          />
        </div>

        {/* 面板切换按钮 */}
        {hasArtifacts && (
          <Button
            variant={panelVisible ? 'secondary' : 'outline'}
            size="icon"
            onClick={onPanelToggle}
            title={panelVisible ? '关闭文件面板' : '打开文件面板'}
          >
            <LayoutGrid className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  )
}
