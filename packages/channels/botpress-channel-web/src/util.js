const PREFIX_RE = /^webchat:/i

export const sanitizeUserId = userId => userId.replace(PREFIX_RE, '')
