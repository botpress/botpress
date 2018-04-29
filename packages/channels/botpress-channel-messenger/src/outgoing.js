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

const handleGetStarted = (event, next, messenger) => {
  if (event.raw.enabled) {
    return handlePromise(next, messenger.setGetStartedButton(event.raw.postback))
  } else {
    return handlePromise(next, messenger.deleteGetStartedButton())
  }
}

const handlePersistentMenu = (event, next, messenger) => {
  if (event.raw.delete) {
    return handlePromise(next, messenger.deletePersistentMenu())
  } else {
    return handlePromise(next, messenger.setPersistentMenu(event.raw.elements))
  }
}

const handleGreetingText = (event, next, messenger) => {
  if (event.raw.text) {
    return handlePromise(next, messenger.setGreetingText(event.raw.text))
  } else {
    return handlePromise(next, messenger.deleteGreetingText(event.raw.text))
  }
}

const handleWhitelistedDomains = (event, next, messenger) => {
  return handlePromise(next, messenger.setWhitelistedDomains(event.raw.domains))
}

module.exports = {
  text: handleText,
  attachment: handleAttachment,
  template: handleTemplate,
  typing: handleTyping,
  seen: handleSeen,
  greeting_text: handleGreetingText,
  persistent_menu: handlePersistentMenu,
  whitelisted_domains: handleWhitelistedDomains,
  get_started: handleGetStarted,
  pending: {}
}
