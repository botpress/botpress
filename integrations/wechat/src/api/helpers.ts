import { RuntimeError } from '@botpress/sdk'

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
