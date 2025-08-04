import { axios } from '@botpress/client'
import { IntegrationLogger, Response, RuntimeError } from '@botpress/sdk'
import { ok } from 'assert'
import _ from 'lodash'
import { Context, Markup, Telegraf, Telegram, TelegramError } from 'telegraf'
import { PhotoSize, Update, User, Sticker } from 'telegraf/typings/core/types/typegram'
import { telegramTextMsgToStdMarkdown } from './telegram-to-markdown'
import { Card, AckFunction, Logger, MessageHandlerProps, BotpressMessage, TelegramMessage } from './types'
import * as bp from '.botpress'

export const USER_PICTURE_MAX_SIZE_BYTES = 25_000

export function parseError(thrown: unknown): never {
  if (thrown instanceof TelegramError) {
    throw new RuntimeError(thrown.description, thrown)
  }

  throw thrown instanceof Error ? new RuntimeError(thrown.message, thrown) : new RuntimeError(String(thrown))
}

export async function ackMessage(message: TelegramMessage, ack: AckFunction) {
  await ack({ tags: { id: `${message.message_id}` } })
}

export async function sendCard(payload: Card, client: Telegraf<Context<Update>>, chat: string, ack: AckFunction) {
  const text = `*${payload.title}*${payload.subtitle ? '\n' + payload.subtitle : ''}`
  const buttons = payload.actions
    .filter((item) => item.value && item.label)
    .map((item) => {
      switch (item.action) {
        case 'url':
          return Markup.button.url(item.label, item.value)
        case 'postback':
          return Markup.button.callback(item.label, `postback:${item.value}`)
        case 'say':
          return Markup.button.callback(item.label, `say:${item.value}`)
        default:
          throw new RuntimeError(`Unknown action type: ${item.action}`)
      }
    })
  if (payload.imageUrl) {
    const message = await client.telegram
      .sendPhoto(chat, payload.imageUrl, {
        caption: text,
        parse_mode: 'MarkdownV2',
        ...Markup.inlineKeyboard(buttons),
      })
      .catch(parseError)
    await ackMessage(message, ack)
  } else {
    const message = await client.telegram
      .sendMessage(chat, text, {
        parse_mode: 'MarkdownV2',
        ...Markup.inlineKeyboard(buttons),
      })
      .catch(parseError)
    await ackMessage(message, ack)
  }
}

export function getChat(conversation: MessageHandlerProps['conversation']): string {
  const chat = conversation.tags.chatId

  if (!chat) {
    throw new RuntimeError(`No chat found for conversation ${conversation.id}`)
  }

  return chat
}

export function getMessageId(message: MessageHandlerProps['message']): number {
  const messageId = message.tags.id

  if (!messageId) {
    throw new RuntimeError(`No message ID found for message ${message.id}`)
  }

  return Number(messageId)
}

export const getUserNameFromTelegramUser = (telegramUser: User) => {
  if (telegramUser.first_name && telegramUser.last_name) {
    return `${telegramUser.first_name} ${telegramUser.last_name}`
  } else if (telegramUser.username) {
    return telegramUser.username
  }
  return telegramUser.first_name
}

const getMimeTypeFromExtension = (extension: string): string => {
  switch (extension.toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'gif':
      return 'image/gif'
    case 'bmp':
      return 'image/bmp'
    case 'svg':
      return 'image/svg+xml'
    default:
      return 'application/octet-stream'
  }
}

const getDataUriFromImgHref = async (imgHref: string): Promise<string> => {
  const fileExtension = imgHref.substring(imgHref.lastIndexOf('.') + 1)

  const { data } = await axios.default.get(imgHref, { responseType: 'arraybuffer' }).catch(parseError)

  const base64File = Buffer.from(data, 'binary').toString('base64')

  return `data:${getMimeTypeFromExtension(fileExtension)};base64,${base64File}`
}

const getBestPhotoSize = (photos: PhotoSize[]): PhotoSize | null => {
  let bestPhoto = null

  for (const photo of photos) {
    const isSizeBelowLimit = !!photo.file_size && photo.file_size < USER_PICTURE_MAX_SIZE_BYTES
    const isSizeAbovePrevious = !!photo.file_size && !!bestPhoto?.file_size && photo.file_size > bestPhoto.file_size

    if (isSizeBelowLimit && (!bestPhoto || isSizeAbovePrevious)) {
      bestPhoto = photo
    }
  }

  return bestPhoto
}

export const getUserPictureDataUri = async ({
  botToken,
  telegramUserId,
  logger,
}: {
  botToken: string
  telegramUserId: number
  logger: Logger
}): Promise<string | null> => {
  try {
    const telegraf = new Telegraf(botToken)
    const res = await telegraf.telegram.getUserProfilePhotos(telegramUserId).catch(parseError)
    logger.forBot().debug('Fetched user profile pictures from Telegram')

    if (!res.photos[0]) {
      logger.forBot().debug('No picture found to update the user profile picture')
      return null
    }
    const photoToUse = getBestPhotoSize(res.photos[0])

    if (photoToUse) {
      const fileLink = await telegraf.telegram.getFileLink(photoToUse.file_id).catch(parseError)

      return await getDataUriFromImgHref(fileLink.href)
    }
    return null
  } catch (error) {
    logger.forBot().error("Couldn't convert Telegram profile picture to base64 Data URI: ", error)
    return null
  }
}

export const convertTelegramMessageToBotpressMessage = async ({
  message,
  telegram,
  logger,
}: {
  message: TelegramMessage
  telegram: Telegram
  logger: IntegrationLogger
}): Promise<BotpressMessage> => {
  if ('photo' in message) {
    const photo = _.maxBy(message.photo, (photo) => photo.height * photo.width)

    ok(photo, 'No photo found in message')
    const fileUrl = await telegram.getFileLink(photo.file_id).catch(parseError)

    return {
      type: 'image',
      payload: {
        imageUrl: fileUrl.toString(),
      },
    }
  }

  if ('sticker' in message) {
    const stickerMessage = message as TelegramMessage & { sticker: Sticker }
    const fileUrl = await telegram.getFileLink(stickerMessage.sticker.file_id).catch(parseError)
    return {
      type: 'image',
      payload: {
        imageUrl: fileUrl.toString(),
      },
    }
  }

  if ('audio' in message) {
    const fileUrl = await telegram.getFileLink(message.audio.file_id).catch(parseError)
    return {
      type: 'audio',
      payload: {
        audioUrl: fileUrl.toString(),
      },
    }
  }

  if ('voice' in message) {
    const fileUrl = await telegram.getFileLink(message.voice.file_id).catch(parseError)
    return {
      type: 'audio',
      payload: {
        audioUrl: fileUrl.toString(),
      },
    }
  }

  if ('video' in message) {
    const fileUrl = await telegram.getFileLink(message.video.file_id).catch(parseError)
    return {
      type: 'video',
      payload: {
        videoUrl: fileUrl.toString(),
      },
    }
  }

  if ('document' in message) {
    const fileUrl = await telegram.getFileLink(message.document.file_id).catch(parseError)
    return {
      type: 'file',
      payload: {
        fileUrl: fileUrl.toString(),
      },
    }
  }

  if ('text' in message) {
    const { text, warnings } = telegramTextMsgToStdMarkdown(message.text, message.entities)
    warnings?.forEach((warningMsg) => logger.forBot().warn(warningMsg))

    return {
      type: 'text',
      payload: { text },
    }
  }

  if ('location' in message) {
    return {
      type: 'location',
      payload: {
        latitude: message.location.latitude,
        longitude: message.location.longitude,
      },
    }
  }

  throw new RuntimeError(`Unsupported message type from Telegram: ${JSON.stringify(message)}`)
}

type Handler = bp.IntegrationProps['handler']
export const wrapHandler =
  (handler: Handler): Handler =>
  async (args: bp.HandlerProps): Promise<Response | void> => {
    try {
      return await handler({
        ...args,
      })
    } catch (thrown) {
      const err = thrown instanceof Error ? thrown : new Error(String(thrown))
      args.logger.forBot().error('Assertion Error:', err.message)
      return { status: 200 }
    }
  }
