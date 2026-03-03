/* eslint-disable @next/next/no-img-element */
import { X, FileIcon, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { ImagePreview } from '@/components/ui/image-preview'
import type { UploadFile } from '../types'

interface FilePreviewListProps {
  files: UploadFile[]
  onRemove: (uid: string) => void
  disabled?: boolean
}

export function FilePreviewList({ files, onRemove, disabled }: FilePreviewListProps) {
  if (files.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
      {files.map(file => {
        const isImage = /\.(jpg|jpeg|png|gif|webp|svg|ico|bmp)$/i.test(file.name)
        const isUploading = file.uploadStatus === 'uploading' || file.uploadStatus === 'pending'
        const hasError = file.uploadStatus === 'error'

        const showImagePreview = isImage && file.url

        return (
          <div
            key={file.uid}
            className={cn(
              "relative group flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border rounded-md text-xs shadow-sm max-w-[200px]",
              hasError ? "border-red-200 dark:border-red-800" : "border-slate-200 dark:border-slate-700",
              file.url && !isUploading ? "cursor-pointer hover:border-primary/50" : ""
            )}
            onClick={() => {
              if (file.url && !isUploading && !hasError) {
                if (!showImagePreview) {
                  window.open(file.url, '_blank')
                }
              }
            }}
          >
            {/* Icon / Image Preview */}
            <div
              className="shrink-0 text-slate-400 w-8 h-8 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded overflow-hidden"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : showImagePreview ? (
                <ImagePreview
                  src={file.url!}
                  alt={file.name}
                  className="w-full h-full flex items-center justify-center"
                >
                  <img
                    src={file.url!}
                    alt={file.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.parentElement?.classList.add('fallback-icon')
                    }}
                  />
                </ImagePreview>
              ) : (
                <FileIcon className="w-4 h-4" />
              )}
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <span className="truncate text-slate-700 dark:text-slate-200 font-medium" title={file.name}>
                {file.name}
              </span>
              <span className="text-[10px] text-slate-400">
                {isUploading ? '上传中...' : hasError ? '上传失败' : formatFileSize(file.byte_size)}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation() // 防止触发打开文件
                onRemove(file.uid)
              }}
              disabled={disabled}
              className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-opacity"
            >
              <X className="w-3 h-3 text-slate-500" />
            </button>

            {/* Progress Bar */}
            {isUploading && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-800 rounded-b-md overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${file.progress || 0}%` }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function formatFileSize(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
