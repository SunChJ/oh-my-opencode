
"use client"

import { useCallback } from 'react'
import type { UploadFile } from '../types'
import { useNova } from '../context/useNova'

// Simple helper to mimic MIME type detection
export const ACCEPT_FILE_TYPE_LIST = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.json', '.csv', '.md',
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg', '.ico',
  '.html', '.py', '.jsonld', '.xml', '.zip',
  '.mp3', '.mp4', '.mov', '.m4a',
  '.pdb', '.mermaid',
]

export function getMimeByAcceptList(filename: string): string | undefined {
  const ext = `.${(filename.split('.').pop() || '').toLowerCase()}`
  const map: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.json': 'application/json',
    '.csv': 'text/csv',
    '.md': 'text/markdown',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.jsonld': 'application/ld+json',
    '.pdb': 'application/vnd.microsoft.portable-executable',
    '.mermaid': 'text/mermaid',
  }
  return map[ext] || undefined
}

export interface UseFileUploaderProps {
  onUploadStart?: (file: UploadFile) => void
  onUploadEnd?: (file: UploadFile) => void
  onUploadError?: (error: Error, file?: UploadFile) => void
  onFileUpdate?: (file: UploadFile) => void
}

export function useFileUploader({
  onUploadStart,
  onUploadEnd,
  onUploadError,
  onFileUpdate,
}: UseFileUploaderProps = {}) {
  const { client: apiClient } = useNova()
  const uploadFile = useCallback(async (file: File) => {
    // 1. Validation
    const isValidSize = file.size <= 100 * 1024 * 1024 // 100MB
    if (!isValidSize) {
      console.warn('File size exceeds 100MB limit')
      return
    }

    // 2. Init file object and State
    const uid = crypto.randomUUID()
    const mimeType = getMimeByAcceptList(file.name) || file.type || 'application/octet-stream'

    const tempFile: UploadFile = {
      uid,
      name: file.name,
      type: mimeType,
      byte_size: file.size,
      uploadStatus: 'pending',
      progress: 0,
      url: URL.createObjectURL(file),
    }

    onUploadStart?.(tempFile)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await apiClient.post('/file/upload', formData)

      const finalFile: UploadFile = {
        ...tempFile,
        name: file.name,
        upload_file_id: res.upload_file_id,
        progress: 100,
        uploadStatus: 'success',
      }

      onFileUpdate?.(finalFile)
      onUploadEnd?.(finalFile)
    } catch (error) {
      console.error('Upload failed:', error)
      const errorFile: UploadFile = {
        ...tempFile,
        uploadStatus: 'error'
      }
      onFileUpdate?.(errorFile)
      onUploadError?.(error as Error, errorFile)
    }
  }, [onUploadStart, apiClient, onFileUpdate, onUploadEnd, onUploadError])

  return {
    uploadFile,
    accept: ACCEPT_FILE_TYPE_LIST.join(','),
  }
}
