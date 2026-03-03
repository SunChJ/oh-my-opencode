/**
 * 获取文件扩展名
 */
function getFileExtension(path: string): string {
  const parts = path.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

/**
 * 判断是否是图片文件
 */
export function isImageFile(path: string): boolean {
  const ext = getFileExtension(path.replace(/\?.*$/, ''))
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)
}

