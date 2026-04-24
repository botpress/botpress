const _EXT_ALIASES: Record<string, string> = { mpga: 'mp3', jfif: 'jpg', jpeg: 'jpg' }

export function ensureExtension(name: string, fileUrl: string): string {
  if (name.includes('.')) {
    return name
  }
  const pathname = new URL(fileUrl).pathname
  const ext = pathname.split('.').pop()
  const normalizedExt = ext ? (_EXT_ALIASES[ext] ?? ext) : undefined
  return normalizedExt ? `${name}.${normalizedExt}` : name
}

export type FileMetadata = { mimeType: string; fileSize?: number; fileName?: string }

export async function getMediaMetadata(url: string): Promise<FileMetadata> {
  const response = await fetch(url, { method: 'HEAD' })
  if (!response.ok) {
    throw new Error(`Failed to fetch file metadata for URL: ${url}`)
  }
  const mimeType = response.headers.get('content-type') ?? 'application/octet-stream'
  const contentLength = response.headers.get('content-length')
  const contentDisposition = response.headers.get('content-disposition')
  const fileSize = contentLength ? Number(contentLength) : undefined
  let fileName: string | undefined
  if (contentDisposition) {
    const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\r\n]+)["']?/i)
    if (match?.[1]) {
      fileName = decodeURIComponent(match[1].trim())
    }
  }
  return { mimeType, fileSize, fileName }
}
