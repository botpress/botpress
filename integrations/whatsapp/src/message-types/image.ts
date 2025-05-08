import { Sticker, Image } from 'whatsapp-api-js/messages'
import * as types from '../types'
import { channels } from '.botpress'

type BPImage = channels.channel.image.Image

type ImageMessageProps = {
  payload: BPImage
  logger: types.Logger
  [key: string]: any
}

/**
 * Generates an appropriate outgoing message (Image or Sticker) based on file type
 */
export function generateOutgoingMessage({
  payload,
  logger
}: ImageMessageProps): Image | Sticker {
  const isWebp = payload.imageUrl.toLowerCase().endsWith('.webp');

  if (isWebp) {
    // If it is a .webp image, return a sticker
    logger.forBot().info("Sending WhatsApp sticker message");
    return new Sticker(payload.imageUrl.trim(), false);
  } else {
    // Otherwise return a normal image
    logger.forBot().info("Sending WhatsApp image message");
    return new Image(payload.imageUrl.trim(), false);
  }
}
