export const botpressEvents = {
  INVALID_PHONE_NUMBER: 'invalid_phone_number',
  UNHANDLED_ERROR: 'unhandled_error',
  UNHANDLED_MARKDOWN: 'unhandled_markdown',
  UNHANDLED_MESSAGE_TYPE: 'unhandled_message_type',
} as const
export type BotpressEvent = (typeof botpressEvents)[keyof typeof botpressEvents]
