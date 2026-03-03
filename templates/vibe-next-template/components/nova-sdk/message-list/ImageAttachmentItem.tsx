"use client"

import { useState, useEffect, memo } from 'react'
import { Loader2 } from 'lucide-react'
import { Image } from '@/components/ui/image'
import type { ImageAttachment, TaskArtifact } from '../types'
import { useNova } from '../context/useNova'

export interface ImageAttachmentItemProps {
  image: ImageAttachment
  onClick?: (image: ImageAttachment) => void
}

function needsOssUrl(image: ImageAttachment): boolean {
  // 如果已经有完整 URL，不需要加载
  if (image.url && image.url.startsWith('http')) {
    return false
  }
  // 有 path 才需要加载
  return !!(image.path || image.url)
}

export const ImageAttachmentItem = memo(function ImageAttachmentItem({ image, onClick }: ImageAttachmentItemProps) {
  const { getArtifactUrl } = useNova()

  // 如果已经有完整 URL，直接使用
  const initialUrl = image.url?.startsWith('http') ? image.url : ''
  const [url, setUrl] = useState<string>(initialUrl)
  const [loading, setLoading] = useState(needsOssUrl(image))

  useEffect(() => {
    // 如果已经有完整 URL，不需要加载
    if (image.url && image.url.startsWith('http')) {
      return
    }

    // 需要通过 path 获取 OSS URL
    const filePath = image.path || image.url
    if (filePath) {
      getArtifactUrl?.({ ...image, path: filePath } as TaskArtifact)
        .then((url: string) => {
          if (url) {
            setUrl(url)
            image.url = url
          }
        })
        .catch((err: Error) => {
          console.error('获取图片 URL 失败:', err)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [image, image.url, image.path, getArtifactUrl])

  if (loading) {
    return (
      <div className="flex items-center justify-center w-32 h-32 bg-muted rounded-lg">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!url) {
    return null
  }

  const handleClick = () => {
    if (onClick) {
      // 传递包含已加载 URL 的 image 对象
      onClick({
        ...image,
        url: url || image.url,
      })
    }
  }

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer"
    >
      <Image
        src={url}
        alt={image.file_name || '图片'}
        className="max-w-full max-h-[300px] rounded-lg hover:opacity-80 transition-opacity"
        preview={!onClick}
      />
    </div>
  )
})

