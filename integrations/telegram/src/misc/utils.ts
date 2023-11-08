import { axios } from '@botpress/client'
import { PICTURE_LIMIT_SIZE } from 'src/const'
import { Telegraf } from 'telegraf'
import { PhotoSize, User } from 'telegraf/typings/core/types/typegram'

export const getUserNameFromTelegramUser = (telegramUser: User) => {
  if (telegramUser.last_name) {
    return `${telegramUser.first_name} ${telegramUser.last_name}`
  } else if (telegramUser.username) {
    return `${telegramUser.first_name} (username: ${telegramUser.username})`
  }
  return `${telegramUser.first_name} (id: ${telegramUser.id})`
}

const getDataUriFromImgHref = async (imgHref: string): Promise<string> => {
  const fileExtension = imgHref.substring(imgHref.lastIndexOf('.') + 1)

  const { data } = await axios.default.get(imgHref, { responseType: 'arraybuffer' })

  const base64File = Buffer.from(data, 'binary').toString('base64')

  return `data:image/${fileExtension};base64,${base64File}`
}

const getBestPhotoSize = (photos: PhotoSize[]): PhotoSize | null =>
  photos.reduce((finalPicture: PhotoSize | null, currentPicture: PhotoSize) => {
    const isSizeBelowLimit = !!currentPicture.file_size && currentPicture.file_size < PICTURE_LIMIT_SIZE
    const isSizeAbovePrevious =
      !!currentPicture.file_size && !!finalPicture?.file_size && currentPicture.file_size > finalPicture.file_size

    // here we want to use the picture with the best resolution below PICTURE_LIMIT_SIZE
    if (isSizeBelowLimit && (!finalPicture || isSizeAbovePrevious)) {
      return currentPicture
    }
    return finalPicture
  }, null) || null

export const getUserPictureDataUri = async ({
  botToken,
  telegramUserId,
}: {
  botToken: string
  telegramUserId: number
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
    console.error("Couldn't convert Telegram profile picture to base64 Data URI: ", error)
    return null
  }
}
