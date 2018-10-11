import Promise from 'bluebird'

const create = obj => {
  let resolve = null
  let reject = null
  const promise = new Promise((r, rj) => {
    resolve = r
    reject = rj
  })

  const messageId = new Date().toISOString() + Math.random()

  const newEvent = Object.assign(
    {
      _promise: promise,
      _resolve: resolve,
      _reject: reject,
      __id: messageId
    },
    obj
  )

  return newEvent
}

const validateChannelId = channelId => {
  if (!/\w+/.test(channelId)) {
    throw new Error('Invalid channel id')
  }
}

const validateText = text => {
  if (typeof text !== 'string') {
    throw new Error('Text must be a string.')
  }
}

const validateAttachments = attachments => {
  if (typeof attachments !== 'object') {
    throw new Error('Expected attachments type to be an object')
  }
}

const createText = (channelId, text, options = {}) => {
  validateChannelId(channelId)
  validateText(text)

  const user = Object.assign({}, options.user)
  delete options.user

  return create({
    platform: 'slack',
    type: 'text',
    text: text,
    raw: {
      channelId: channelId,
      options: options,
      user
    }
  })
}

const createAttachments = (channelId, attachments, options = {}) => {
  validateChannelId(channelId)
  validateAttachments(attachments)

  const user = Object.assign({}, options.user)
  delete options.user

  attachments = attachments.map(attachment => {
    if (attachment.callback_id) {
      return attachment
    }

    const defaultPrefix = attachment.text ? attachment.text.replace(/\s/g, '_') : 'slack_attachment'
    const defaultCallbackId = `${defaultPrefix}:${Date.now()}`

    return { ...attachment, callback_id: defaultCallbackId }
  })

  return create({
    platform: 'slack',
    type: 'attachments',
    text: 'App sent an attachments',
    raw: {
      channelId: channelId,
      attachments: attachments,
      options: options,
      user
    }
  })
}

const createReaction = (name, options = {}) => {
  const user = Object.assign({}, options.user)
  delete options.user

  return create({
    platform: 'slack',
    type: 'reaction',
    text: 'App sent a reaction',
    raw: {
      name: name,
      options: options,
      user
    }
  })
}

const createUpdateText = (ts, channelId, text, options = {}) => {
  validateChannelId(channelId)
  validateText(text)

  const user = Object.assign({}, options.user)
  delete options.user

  return create({
    platform: 'slack',
    type: 'update_text',
    text: text,
    raw: {
      channelId: channelId,
      ts: ts,
      options: options,
      user
    }
  })
}

const createUpdateAttachments = (ts, channelId, attachments, options = {}) => {
  validateChannelId(channelId)
  validateAttachments(attachments)

  const user = Object.assign({}, options.user)
  delete options.user

  return create({
    platform: 'slack',
    type: 'update_attachments',
    text: 'App updated an attachments',
    raw: {
      channelId: channelId,
      attachments: attachments,
      ts: ts,
      options: options,
      user
    }
  })
}

const createDeleteTextOrAttachments = (ts, channelId, options = {}) => {
  validateChannelId(channelId)

  const user = Object.assign({}, options.user)
  delete options.user

  return create({
    platform: 'slack',
    type: 'delete_text_or_attachments',
    text: 'App deleted a text or an attachments',
    raw: {
      channelId: channelId,
      ts: ts,
      options: options,
      user
    }
  })
}

const createRemoveReaction = (name, options = {}) => {
  const user = Object.assign({}, options.user)
  delete options.user

  return create({
    platform: 'slack',
    type: 'remove_reaction',
    text: 'App remove a reaction',
    raw: {
      name: name,
      options: options,
      user
    }
  })
}

module.exports = {
  createText,
  createAttachments,
  createReaction,
  createUpdateText,
  createUpdateAttachments,
  createDeleteTextOrAttachments,
  createRemoveReaction
}
