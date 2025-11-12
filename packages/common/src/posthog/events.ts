export const botpressEvents = {
  INVALID_PHONE_NUMBER: 'invalid_phone_number',
  UNHANDLED_MESSAGE_TYPE: 'unhandled_message_type',
  UNHANDLED_ERROR: 'unhandled_error',
} as const
export type BotpressEvent = (typeof botpressEvents)[keyof typeof botpressEvents]
