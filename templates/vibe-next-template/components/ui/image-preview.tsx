import * as React from 'react'
import Image from 'next/image'
import { Dialog, DialogContent } from './dialog'
import { cn } from '@/utils/cn'

export interface ImagePreviewProps {
  /** 图片 URL */
  src: string
  /** 图片描述 */
  alt?: string
  /** 是否打开 */
  open?: boolean
  /** 打开/关闭回调 */
  onOpenChange?: (open: boolean) => void
  /** 子元素（通常是 Image 组件） */
  children?: React.ReactNode
  /** 自定义类名 */
  className?: string
}

/**
 * ImagePreview 组件 - 图片预览对话框
 */
export function ImagePreview({
  src,
  alt = '图片预览',
  open: controlledOpen,
  onOpenChange,
  children,
  className,
}: ImagePreviewProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = React.useCallback(
    (value: boolean) => {
      if (controlledOpen === undefined) {
        setInternalOpen(value)
      }
      onOpenChange?.(value)
    },
    [controlledOpen, onOpenChange]
  )

  const handleChildClick = React.useCallback(() => {
    setOpen(true)
  }, [setOpen])

  return (
    <>
      {children ? (
        <div onClick={handleChildClick} className={cn('cursor-pointer', className)}>
          {children}
        </div>
      ) : null}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-transparent border-0 shadow-none">
          <div className="relative flex items-center justify-center w-full h-full">
            <Image
              src={src}
              alt={alt}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

