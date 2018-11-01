export const BOTID_REGEX = /^[A-Z0-9]+[A-Z0-9_-]{2,}[A-Z0-9]+$/i

export const isValidBotId = (botId: string): boolean => BOTID_REGEX.test(botId)
