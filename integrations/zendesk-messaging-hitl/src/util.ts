export type FileMetadata = { mimeType: string; fileSize?: number; fileName?: string }

export async function getMediaMetadata(url: string): Promise<FileMetadata> {
  const response = await fetch(url, { method: 'HEAD' })

  if (!response.ok) {
    throw new Error(`Failed to fetch metadata for URL: ${url}`)
  }

  const mimeType = response.headers.get('content-type') ?? 'application/octet-stream'
  const contentLength = response.headers.get('content-length')
  const contentDisposition = response.headers.get('content-disposition')

  const fileSize = contentLength ? Number(contentLength) : undefined

  // Try to extract filename from content-disposition
  let fileName: string | undefined
  if (contentDisposition) {
    const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?"?([^"]+)"?/i)
    const rawFileName = match?.[1]
    if (rawFileName) {
      fileName = decodeURIComponent(rawFileName)
    }
  }

  return {
    mimeType,
    fileSize,
    fileName,
  }
}
