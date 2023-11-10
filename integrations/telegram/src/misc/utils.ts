import { axios } from '@botpress/client'
import { IntegrationLogger } from 'src'
import { USER_PICTURE_MAX_SIZE_BYTES } from 'src/const'
import { Telegraf } from 'telegraf'
import { PhotoSize, User } from 'telegraf/typings/core/types/typegram'

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

    if (!res.photos[0]) {
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
