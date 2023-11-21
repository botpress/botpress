import { axios, Conversation } from '@botpress/client'
import { AckFunction } from '@botpress/sdk'
import { IntegrationLogger } from 'src'
import { idTag, USER_PICTURE_MAX_SIZE_BYTES } from 'src/const'
import { Context, Markup, Telegraf } from 'telegraf'
import { PhotoSize, Update, User } from 'telegraf/typings/core/types/typegram'
import { Card, TelegramMessage } from './types'

export async function ackMessage(message: TelegramMessage, ack: AckFunction) {
  await ack({ tags: { [idTag]: `${message.message_id}` } })
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

export function getChat(conversation: Conversation): string {
  const chat = conversation.tags[idTag]

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
  logger: IntegrationLogger
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
