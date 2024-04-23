import { axios } from '@botpress/client'
import { AssertionError, ok } from 'assert'
import _ from 'lodash'
import { Context, Markup, Telegraf, Telegram } from 'telegraf'
import { PhotoSize, Update, User } from 'telegraf/typings/core/types/typegram'
import { Card, AckFunction, Logger, MessageHandlerProps, BotpressMessage, TelegramMessage } from './types'
import * as bp from '.botpress'

export const USER_PICTURE_MAX_SIZE_BYTES = 25_000

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
          throw new Error(`Unknown action type: ${item.action}`)
      }
    })
  if (payload.imageUrl) {
    const message = await client.telegram.sendPhoto(chat, payload.imageUrl, {
      caption: text,
      parse_mode: 'MarkdownV2',
      ...Markup.inlineKeyboard(buttons),
    })
    await ackMessage(message, ack)
  } else {
    const message = await client.telegram.sendMessage(chat, text, {
      parse_mode: 'MarkdownV2',
      ...Markup.inlineKeyboard(buttons),
    })
    await ackMessage(message, ack)
  }
}

export function getChat(conversation: MessageHandlerProps['conversation']): string {
  const chat = conversation.tags.chatId

  if (!chat) {
    throw Error(`No chat found for conversation ${conversation.id}`)
  }

  return chat
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

  const { data } = await axios.default.get(imgHref, { responseType: 'arraybuffer' })

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
    const res = await telegraf.telegram.getUserProfilePhotos(telegramUserId)
    logger.forBot().debug('Fetched user profile pictures from Telegram')

    if (!res.photos[0]) {
      logger.forBot().debug('No picture found to update the user profile picture')
      return null
    }
    const photoToUse = getBestPhotoSize(res.photos[0])

    if (photoToUse) {
      const fileLink = await telegraf.telegram.getFileLink(photoToUse.file_id)

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
}: {
  message: TelegramMessage
  telegram: Telegram
}): Promise<BotpressMessage> => {
  if ('photo' in message) {
    const photo = _.maxBy(message.photo, (photo) => photo.height * photo.width)

    ok(photo, 'No photo found in message')
    const fileUrl = await telegram.getFileLink(photo.file_id)

    return {
      type: 'image',
      payload: {
        imageUrl: fileUrl.toString(),
      },
    }
  }

  if ('audio' in message) {
    const fileUrl = await telegram.getFileLink(message.audio.file_id)
    return {
      type: 'audio',
      payload: {
        audioUrl: fileUrl.toString(),
      },
    }
  }

  if ('voice' in message) {
    const fileUrl = await telegram.getFileLink(message.voice.file_id)
    return {
      type: 'audio',
      payload: {
        audioUrl: fileUrl.toString(),
      },
    }
  }

  if ('video' in message) {
    const fileUrl = await telegram.getFileLink(message.video.file_id)
    return {
      type: 'video',
      payload: {
        videoUrl: fileUrl.toString(),
      },
    }
  }

  if ('document' in message) {
    const fileUrl = await telegram.getFileLink(message.document.file_id)
    return {
      type: 'file',
      payload: {
        fileUrl: fileUrl.toString(),
      },
    }
  }

  if ('text' in message) {
    return {
      type: 'text',
      payload: { text: message.text },
    }
  }

  throw new Error('Unsupported message type')
}

type Webhook = bp.Integration['webhook']
type AugmentedWebhook = (arg: Parameters<Webhook>[0]) => ReturnType<Webhook>

export class WebhookAssertionError extends Error {}

export const wrapHandler =
  (handler: AugmentedWebhook) =>
  async (...props: Parameters<Webhook>) => {
    const args = props[0]

    try {
      return handler({
        ...args,
      })
    } catch (err) {
      if (err instanceof AssertionError) {
        args.logger.forBot().error('Assertion Error:', err.message)
      } else {
        throw err
      }
    }
  }
