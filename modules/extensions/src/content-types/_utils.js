function extractPayload(type, data) {
  const payload = {
    type,
    ...data
  }

  delete payload.event
  delete payload.temp
  delete payload.user
  delete payload.session
  delete payload.bot
  delete payload.BOT_URL

  return payload
}

module.exports = {
  extractPayload: extractPayload
}
