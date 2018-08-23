import Promise from 'bluebird'
const { driver } = require('@rocket.chat/sdk')

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
  validateText(text)
  return create({
    platform: 'rocketchat',
    type: 'text',
    text: text,
    raw: {
      channelId: channelId,
      options: options
    }
  })
}

const createAttachments = (channelId, attachments, options = {}) => {
  validateAttachments(attachments)

  return create({
    platform: 'rocketchat',
    type: 'attachments',
    text: 'App sent an attachments',
    raw: {
      channelId: channelId,
      attachments: attachments,
      options: options
    }
  })
}

const createReaction = (name, options = {}) => {
  return create({
    platform: 'rocketchat',
    type: 'reaction',
    text: 'App sent a reaction',
    raw: {
      name: name,
      options: options
    }
  })
}

// TODO
const livechatTransfer = (name, options = {}) => {
  return create({
    platform: 'rocketchat',
    type: 'livechat_transfer',
    text: 'transfer livechat',
    raw: {
      name: name,
      options: options
    }
  })
}

const callMethod = (method, ...args) => {
  return driver.callMethod(method, args)
}

module.exports = {
  createText,
  createAttachments,
  createReaction,
  livechatTransfer,
  callMethod
}
