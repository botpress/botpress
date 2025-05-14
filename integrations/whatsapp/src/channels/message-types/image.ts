import axios from 'axios'
import { Sticker, Image } from 'whatsapp-api-js/messages'
import * as types from '../types'
import { channels } from '.botpress'

type BPImage = channels.channel.image.Image

type ImageMessageProps = {
  payload: BPImage
  logger: types.Logger
  [key: string]: any
}

function parseWebPDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.toString('utf8', 0, 4) !== 'RIFF' || buffer.toString('utf8', 8, 12) !== 'WEBP') {
    return null
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
      return null
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

  return null
}

/**
 * Generates an appropriate outgoing message (Image or Sticker) based on file type and constraints
 */
export async function generateOutgoingMessage({
  payload,
  logger,
}: ImageMessageProps): Promise<Image | Sticker | undefined> {
  const url = payload.imageUrl.trim()
  const isWebp = url.toLowerCase().endsWith('.webp')

  if (!isWebp) {
    logger.forBot().info('Sending WhatsApp image message (not webp)')
    return new Image(url, false)
  }

  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' })
    const buffer = Buffer.from(response.data)

    const isUnderSizeLimit = buffer.length < 512 * 1024 // 512 KB
    const dimensions = parseWebPDimensions(buffer)

    if (dimensions?.width === 512 && dimensions.height === 512 && isUnderSizeLimit) {
      logger.forBot().info('Sending WhatsApp sticker message (valid webp, size and dimensions ok)')
      return new Sticker(url, false)
    } else if (!isUnderSizeLimit) {
      logger
        .forBot()
        .warn(
          `Image is too big for a sticker. Current size is ${buffer.length} bytes. Must be smaller than ${512 * 1024} bytes`
        )
      return undefined
    } else {
      logger
        .forBot()
        .warn(
          `Image does not meet WhatsApp size requirements. Current size is ${dimensions?.width} wide by ${dimensions?.height} high. Expected dimensions are 512 x 512`
        )
      return undefined
    }
  } catch (error) {
    logger.forBot().error('Error processing image for sticker:', error)
    return undefined
  }
}
