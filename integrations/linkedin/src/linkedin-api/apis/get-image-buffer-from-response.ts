const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif']
const BYTES_PER_MB = 1024 * 1024
const MAX_IMAGE_SIZE_BYTES = 8 * BYTES_PER_MB // 8MB

export const getImageBufferFromResponse = async (
  response: Response
): Promise<{ success: true; buffer: ArrayBuffer } | { success: false; message: string }> => {
  if (!response.ok) {
    return {
      success: false,
      message: `Failed to download image from provided URL (status: ${response.status})`,
    }
  }

  const contentType = response.headers.get('content-type')?.toLowerCase() || ''
  const contentLength = response.headers.get('content-length')

  const isValidType = SUPPORTED_IMAGE_TYPES.some((type) => contentType.includes(type))
  if (!isValidType) {
    return {
      success: false,
      message: `Unsupported image format: ${contentType}. LinkedIn supports: JPEG, PNG, GIF.`,
    }
  }

  if (contentLength) {
    const size = parseInt(contentLength, 10)
    if (size > MAX_IMAGE_SIZE_BYTES) {
      return {
        success: false,
        message: `Image size (${Math.round(size / BYTES_PER_MB)}MB) exceeds LinkedIn's 8MB limit.`,
      }
    }
  }

  const imageBuffer = await response.arrayBuffer()

  if (imageBuffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
    return {
      success: false,
      message: `Image size (${Math.round(imageBuffer.byteLength / BYTES_PER_MB)}MB) exceeds LinkedIn's 8MB limit.`,
    }
  }

  return {
    success: true,
    buffer: imageBuffer,
  }
}
