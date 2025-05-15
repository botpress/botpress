import axios from 'axios'
import * as WhatsappMessages from 'whatsapp-api-js/messages'
import * as bp from '.botpress'

type Image = bp.channels.channel.image.Image
type ImageMessageProps = {
  payload: Image
  logger: bp.Logger
}

type ImageDimensions = {
  width: number
  height: number
}

const MAX_STICKER_FILE_SIZE = 512 * 1024 // 512 KB

function _parseWebPDimensions(buffer: Buffer): ImageDimensions | undefined {
  if (buffer.toString('utf8', 0, 4) !== 'RIFF' || buffer.toString('utf8', 8, 12) !== 'WEBP') {
    return undefined
  }

  const chunkHeader = buffer.toString('utf8', 12, 16)

  if (chunkHeader === 'VP8 ') {
    // Lossy format
    return {
      width: buffer.readUInt16LE(26),
      height: buffer.readUInt16LE(28),
    }
  }

  if (chunkHeader === 'VP8L') {
    // Lossless format
    const b0 = buffer[21]
    const b1 = buffer[22]
    const b2 = buffer[23]
    const b3 = buffer[24]
    if (!(b0 && b1 && b2 && b3)) {
      return undefined
    }

    const width = 1 + (((b1 & 0x3f) << 8) | b0)
    const height = 1 + (((b3 & 0xf) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6))
    return { width, height }
  }

  if (chunkHeader === 'VP8X') {
    // Extended format
    const width = 1 + buffer.readUIntLE(24, 3) // 3 bytes: offset 24–26
    const height = 1 + buffer.readUIntLE(27, 3) // 3 bytes: offset 27–29
    return { width, height }
  }

  return undefined
}

/**
 * Generates an appropriate outgoing message (Image or Sticker) based on file type and constraints
 */
export async function generateOutgoingMessage({
  payload,
  logger,
}: ImageMessageProps): Promise<WhatsappMessages.Image | WhatsappMessages.Sticker | undefined> {
  const url = payload.imageUrl.trim()
  if (url.toLowerCase().endsWith('.webp')) {
    return await _generateSticker(payload, logger)
  } else {
    return _generateImage(payload, logger)
  }
}

function _generateImage(payload: Image, logger: bp.Logger): WhatsappMessages.Image | undefined {
  logger.forBot().debug('Sending WhatsApp Image')
  const url = payload.imageUrl.trim()
  return new WhatsappMessages.Image(url, false)
}

async function _generateSticker(payload: Image, logger: bp.Logger): Promise<WhatsappMessages.Sticker | undefined> {
  // Check if the image is a valid WebP format and meets WhatsApp requirements,
  // as invalid WebP images (stickers) are silently ignored by WhatsApp.
  const url = payload.imageUrl.trim()
  const downloadResponse = await axios.get(url, { responseType: 'arraybuffer' })
  const buffer = Buffer.from(downloadResponse.data)
  if (buffer.length > MAX_STICKER_FILE_SIZE) {
    logger
      .forBot()
      .warn(
        `Image is too big for a sticker. Current size is ${buffer.length} bytes. Must be smaller than ${MAX_STICKER_FILE_SIZE} bytes`
      )
    return undefined
  }

  let dimensions: ImageDimensions | undefined = undefined
  try {
    dimensions = _parseWebPDimensions(buffer)
  } catch (error: any) {
    logger.forBot().error('Error parsing WebP dimensions:', error?.message ?? '[unknown error]')
    return undefined
  }

  if (!dimensions) {
    logger.forBot().warn('Image is not in a valid WebP format')
    return undefined
  } else if (dimensions.width !== 512 || dimensions.height !== 512) {
    logger
      .forBot()
      .warn(
        `Image does not meet WhatsApp size requirements (Current ${dimensions.width}x${dimensions.height}, Expected 512x512)`
      )
    return undefined
  }

  logger.forBot().debug('Sending WhatsApp Sticker')
  return new WhatsappMessages.Sticker(url, false)
}
