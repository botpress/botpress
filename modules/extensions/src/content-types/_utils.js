function extractPayload(type, data) {
  // for channel renderers
  return { type, ..._.pickBy(_.omit(data, 'event', 'temp', 'user', 'session', 'bot', 'BOT_URL'), v => v !== undefined) }
}

module.exports = {
  extractPayload: extractPayload
}
