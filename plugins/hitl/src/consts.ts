import * as sdk from '@botpress/sdk'

export const SUPPORTED_MESSAGE_TYPES = [
  'text',
  'image',
  'video',
  'audio',
  'file',
] as const satisfies (keyof typeof sdk.messages.defaults)[]
