"use client"

import React, { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { useSize } from '../../hooks/useSize'

export interface SlideItem {
  content: string
  [key: string]: unknown
}

export interface PptPreviewProps {
  /** PPT 文件的 URL */
  url: string
}

/**
 * PPT 预览组件
 */
export function PptPreview({ url }: PptPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [slideList, setSlideList] = useState<SlideItem[]>([])
  const [loading, setLoading] = useState(true)

  React.useEffect(() => {
    if (!url) return

    setLoading(true)
    fetch(url)
      .then(res => res.json())
      .then(data => {
        const slides = data.slide_list || []
        setSlideList(slides)
      })
      .catch(() => setSlideList([]))
      .finally(() => setLoading(false))
  }, [url])

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-muted-foreground">
        <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
        <span className="text-sm mt-2">加载中...</span>
      </div>
    )
  }

  if (!slideList || slideList.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-muted-foreground">
        <div className="text-6xl mb-4">📊</div>
        <p className="text-sm">暂无幻灯片内容</p>
      </div>
    )
  }

  return <PptSlideViewer slideList={slideList} currentIndex={currentIndex} setCurrentIndex={setCurrentIndex} />
}

export function PptSlideViewer({
  slideList,
  currentIndex,
  setCurrentIndex
}: {
  slideList: SlideItem[]
  currentIndex: number
  setCurrentIndex: (index: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const size = useSize(containerRef)
  const [iframeHeight, setIframeHeight] = useState(720)
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'error'>('loading')

  const currentSlide = slideList[currentIndex]
  const scale = size ? size.width / 1280 : 1

  const handleIframeLoad = (event: React.SyntheticEvent<HTMLIFrameElement>) => {
    const iframe = event.currentTarget
    try {
      const actualHeight = iframe.contentDocument?.documentElement.scrollHeight
      if (actualHeight && actualHeight > 0) {
        setIframeHeight(actualHeight)
      }
      setLoadState('loaded')
    } catch (error) {
      console.warn('Cannot access iframe content:', error)
      setLoadState('loaded')
    }
  }

  const handleIframeError = () => {
    setLoadState('error')
  }

  // 切换幻灯片时重置加载状态
  React.useEffect(() => {
    setLoadState('loading')
    setIframeHeight(720)
  }, [currentIndex])

  return (
    <div className="flex flex-col h-full">
      {/* 主预览区 */}
      <div className="flex-1 flex flex-col items-center p-4 overflow-hidden">
        <div className="flex-1 w-full flex items-center justify-center">
          <div
            ref={containerRef}
            className="w-full rounded-lg overflow-hidden bg-white border border-solid border-border shadow-lg relative"
            style={{
              height: scale ? `${iframeHeight * scale}px` : '720px',
              maxHeight: 'calc(100% - 4rem)'
            }}
          >
            {loadState === 'loading' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
                <p className="text-muted-foreground text-sm mt-2">加载中...</p>
              </div>
            )}
            <iframe
              ref={iframeRef}
              srcDoc={currentSlide.content}
              className={cn(
                'w-[1280px] border-0 origin-top-left transition-opacity duration-300 ease-in-out',
                loadState === 'loading' ? 'opacity-0' : 'opacity-100'
              )}
              title={`Slide ${currentIndex + 1}`}
              sandbox="allow-same-origin allow-scripts"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              style={{
                height: `${iframeHeight}px`,
                transform: `scale(${scale})`,
              }}
            />
          </div>
        </div>

        {/* 页码和导航 */}
        <div className="flex items-center gap-4 mt-4 shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <span className="text-sm font-medium">
            {currentIndex + 1} / {slideList.length}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentIndex(Math.min(slideList.length - 1, currentIndex + 1))}
            disabled={currentIndex === slideList.length - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 缩略图列表 */}
      {slideList.length > 1 && (
        <div className="shrink-0 border-t p-3 bg-muted/20">
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-1 w-max">
              {slideList.map((slide, index) => (
                <button
                  key={index}
                  type="button"
                  className={cn(
                    'shrink-0 w-48 aspect-video rounded-lg overflow-hidden border-2 transition-all relative bg-white',
                    currentIndex === index
                      ? 'border-primary shadow-md ring-2 ring-primary/20'
                      : 'border-transparent hover:border-muted'
                  )}
                  onClick={() => setCurrentIndex(index)}
                >
                  <div className="w-full h-full overflow-hidden">
                    <iframe
                      srcDoc={slide.content}
                      className="w-full h-full border-0 pointer-events-none origin-top-left"
                      title={`Thumbnail ${index + 1}`}
                      sandbox="allow-same-origin"
                      style={{
                        transform: 'scale(1)',
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-transparent pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 text-center pointer-events-none">
                    {index + 1}
                  </div>
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
