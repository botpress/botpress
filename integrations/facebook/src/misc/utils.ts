import { RuntimeError } from '@botpress/sdk'
import axios from 'axios'

export function safeJsonParse(x: any) {
  try {
    return { data: JSON.parse(x), success: true }
  } catch {
    return { data: x, success: false }
  }
}

export type FileMetadata = { mimeType: string; fileSize?: number; fileName?: string }

export async function getMediaMetadata(url: string): Promise<FileMetadata> {
  const response = await fetch(url, { method: 'HEAD' })

  if (!response.ok) {
    throw new RuntimeError(`Failed to fetch metadata for URL: ${url}`)
  }

  const mimeType = response.headers.get('content-type') ?? 'application/octet-stream'
  const contentLength = response.headers.get('content-length')
  const contentDisposition = response.headers.get('content-disposition')

  const fileSize = contentLength ? Number(contentLength) : undefined
  if (fileSize !== undefined && isNaN(fileSize)) {
    throw new RuntimeError(`Failed to parse file size from response: ${contentLength}`)
  }

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

export async function generateIdFromUrl(url: string): Promise<string> {
  const buffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(url))
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 24)
}

export function getErrorFromUnknown(thrown: unknown): Error {
  if (thrown instanceof Error) {
    return thrown
  }
  return new Error(String(thrown))
}

const isMetaError = (
  error: unknown
): error is { response: { data: { error: { message: string; error_user_msg: string } } } } => {
  return (
    axios.isAxiosError(error) &&
    'error' in error.response?.data &&
    'error_user_msg' in error.response?.data.error &&
    'message' in error.response?.data.error &&
    error.response?.data.error.message &&
    error.response?.data.error.error_user_msg
  )
}

export const makeMetaErrorHandler = (url: string) => {
  return (error: unknown) => {
    const baseMessage = `Error calling Meta API with url ${url}`
    if (isMetaError(error)) {
      const metaError = error.response.data.error
      throw new RuntimeError(`${baseMessage}: ${metaError.message}, ${metaError.error_user_msg}`)
    } else if (error instanceof Error) {
      throw new RuntimeError(`${baseMessage}: ${error.message}`)
    }
    throw new RuntimeError(`${baseMessage}: Unknown error`)
  }
}
