export const USER_PICTURE_MAX_SIZE_BYTES = 25_000
export const INTEGRATION_NAME = 'telegram'
export const idTag = `${INTEGRATION_NAME}:id` as const
export const chatIdTag = `${INTEGRATION_NAME}:chatId` as const // Conversation the message belongs to (see: https://core.telegram.org/bots/api#chat)
export const senderIdTag = `${INTEGRATION_NAME}:senderId` as const
