import { RuntimeError } from '@botpress/sdk'
import { useHandleCaughtError } from '../utils'
import { httpGetAsBuffer } from './axios-helpers'
import * as bp from '.botpress'

const MAX_MEDIA_BYTES = 10 * 1024 * 1024

/** @remark This file extension map is not exhaustive. */
const CONTENT_TYPE_TO_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
}

type MediaProp = Partial<Record<'media_id' | 'video_url', string | undefined>>
export const getValidMediaPropOrThrow = <T extends MediaProp>(
  targetKey: Extract<keyof Required<T>, string>,
  data: T & { errcode?: number; errmsg?: string },
  errorMsg: string
) => {
  const hasErrorCode = data.errcode && data.errcode !== 0
  const targetValue = data[targetKey] as MediaProp[keyof MediaProp]
  if (hasErrorCode || !targetValue) {
    const errorSuffix = hasErrorCode ? `(Error code: ${data.errcode}) ${data.errmsg}` : `missing ${targetKey}`
    throw new RuntimeError(`${errorMsg} -> ${errorSuffix}`)
  }

  return targetValue
}

/** Converts the content type to a file extension recognized by WeChat.
 *
 *  @remark Expects "contentType" to be striped of additional attributes
 *   found in the header, such as the charset, BEFORE being passed in. */
export const convertContentTypeToFileExtension = (contentType: string) => {
  const fileExtension = CONTENT_TYPE_TO_EXTENSION_MAP[contentType]

  if (!fileExtension) {
    throw new RuntimeError(`Unsupported media content type: ${contentType}`)
  }

  return fileExtension
}

/** Downloads media from a given URL and converts it into a Blob. While
 *   ensuring it's not too large to be uploaded to WeChat's servers.
 *
 *  @remark The intended use-case is for media not coming from WeChat,
 *   hense why this function is not directly in the WeChatClient. */
export const downloadMediaFromURL = async (mediaUrl: string, logger: bp.Logger) => {
  const resp = await httpGetAsBuffer(mediaUrl, logger).catch(
    useHandleCaughtError(`Failed to download media from URL: '${mediaUrl}'`)
  )

  if (resp === null) {
    throw new RuntimeError(`Failed to download media from URL: '${mediaUrl}' -> No content`)
  }

  const { data: mediaBuffer, contentType } = resp
  const contentLength = mediaBuffer.byteLength
  if (Number.isFinite(contentLength) && contentLength > MAX_MEDIA_BYTES) {
    throw new RuntimeError(`Media exceeds max size of ${MAX_MEDIA_BYTES} bytes`)
  }

  const mediaBlob = new Blob([mediaBuffer], { type: contentType })
  const fileExtension = convertContentTypeToFileExtension(contentType)

  return { mediaBlob, fileExtension }
}
