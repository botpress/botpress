export const BOTID_REGEX = /^[A-Z0-9]+[A-Z0-9_-]{1,}[A-Z0-9]+$/i
export const WORKSPACEID_REGEX = /[A-Z0-9-_\/]/i

export const isValidBotId = (botId: string): boolean => BOTID_REGEX.test(botId)
