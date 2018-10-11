const handlePromise = (next, promise) => {
  return promise
    .then(res => {
      next()
      return res
    })
    .catch(err => {
      next(err)
      throw err
    })
}

const handleText = (event, next, messenger) => {
  return handlePromise(
    next,
    messenger.sendTextMessage(event.raw.to, event.raw.message, event.raw.quick_replies, event.raw)
  )
}

const handleAttachment = (event, next, messenger) => {
  return handlePromise(
    next,
    messenger.sendAttachment(event.raw.to, event.raw.type, event.raw.url, event.raw.quick_replies, event.raw)
  )
}

const handleTemplate = (event, next, messenger) => {
  return handlePromise(next, messenger.sendTemplate(event.raw.to, event.raw.payload, event.raw))
}

const handleTyping = (event, next, messenger) => {
  return handlePromise(next, messenger.sendTypingIndicator(event.raw.to, event.raw.typing))
}

const handleSeen = (event, next, messenger) => {
  return handlePromise(next, messenger.sendAction(event.raw.to, 'mark_seen'))
}

module.exports = {
  text: handleText,
  attachment: handleAttachment,
  template: handleTemplate,
  typing: handleTyping,
  seen: handleSeen,
  pending: {}
}
