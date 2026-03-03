import * as React from 'react'
import { cn } from '@/utils/cn'

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** 图片源 */
  src: string
  /** 替代文本 */
  alt: string
  /** 是否可点击预览 */
  preview?: boolean
  /** 点击回调 */
  onClick?: () => void
}

/**
 * Image 组件 - 基于 shadcn 风格的图片组件
 */
export const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  ({ className, src, alt, preview, onClick, ...props }, ref) => {
    const handleClick = () => {
      if (preview || onClick) {
        onClick?.()
      }
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={cn(
          'max-w-full object-contain',
          (preview || onClick) && 'cursor-pointer hover:opacity-90 transition-opacity',
          className
        )}
        onClick={handleClick}
        loading="lazy"
        {...props}
      />
    )
  }
)

Image.displayName = 'Image'
