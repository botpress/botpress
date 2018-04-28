const handlePromise = (event, next, promise) => {
  return promise
    .then(res => {
      next()
      event._resolve && event._resolve()
      return res
    })
    .catch(err => {
      next(err)
      event._reject && event._reject(err)
      throw err
    })
}

const handleText = (event, next, slack) => {
  if (event.platform !== 'slack' || event.type !== 'text') {
    return next()
  }

  const channelId = event.raw.channelId
  const text = event.text
  const options = event.raw.options

  return handlePromise(event, next, slack.sendText(channelId, text, options))
}

const handleUpdateText = (event, next, slack) => {
  if (event.platform !== 'slack' || event.type !== 'update_text') {
    return next()
  }

  const channelId = event.raw.channelId
  const text = event.text
  const options = event.raw.options
  const ts = event.raw.ts

  return handlePromise(event, next, slack.sendUpdateText(ts, channelId, text, options))
}

const handleAttachments = (event, next, slack) => {
  if (event.platform !== 'slack' || event.type !== 'attachments') {
    return next()
  }

  const channelId = event.raw.channelId
  const attachments = event.raw.attachments
  const options = event.raw.options

  return handlePromise(event, next, slack.sendAttachments(channelId, attachments, options))
}

const handleUpdateAttachments = (event, next, slack) => {
  if (event.platform !== 'slack' || event.type !== 'update_attachments') {
    return next()
  }

  const channelId = event.raw.channelId
  const attachments = event.raw.attachments
  const options = event.raw.options
  const ts = event.raw.ts

  return handlePromise(event, next, slack.sendUpdateAttachments(ts, channelId, attachments, options))
}

const handleDeleteTextOrAttachments = (event, next, slack) => {
  if (event.platform !== 'slack' || event.type !== 'delete_text_or_attachments') {
    return next()
  }

  const channelId = event.raw.channelId
  const options = event.raw.options
  const ts = event.raw.ts

  return handlePromise(event, next, slack.sendDeleteTextOrAttachments(ts, channelId, options))
}

const handleReaction = (event, next, slack) => {
  if (event.platform !== 'slack' || event.type !== 'reaction') {
    return next()
  }

  const name = event.raw.name
  const options = event.raw.options

  return handlePromise(event, next, slack.sendReaction(name, options))
}

const handleRemoveReaction = (event, next, slack) => {
  if (event.platform !== 'slack' || event.type !== 'remove_reaction') {
    return next()
  }

  const name = event.raw.name
  const options = event.raw.options

  return handlePromise(event, next, slack.sendRemoveReaction(name, options))
}

module.exports = {
  text: handleText,
  attachments: handleAttachments,
  reaction: handleReaction,
  update_text: handleUpdateText,
  update_attachments: handleUpdateAttachments,
  delete_text_or_attachments: handleDeleteTextOrAttachments,
  remove_reaction: handleRemoveReaction
}
