"use client"

import React from 'react'
import { FileText } from 'lucide-react'
import type { Attachment } from '../types'

export interface AttachmentItemProps {
  attachment: Attachment
  onClick?: (attachment: Attachment) => void
}

export function AttachmentItem({ attachment, onClick }: AttachmentItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault()
      onClick(attachment)
    }
  }

  return (
    <a
      href={attachment.file_url}
      target={onClick ? undefined : "_blank"}
      rel="noopener noreferrer"
      onClick={handleClick}
      className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
    >
      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <span className="text-sm text-foreground truncate max-w-[200px]">
        {attachment.file_name}
      </span>
    </a>
  )
}

