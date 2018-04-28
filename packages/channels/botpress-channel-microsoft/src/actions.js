import _ from 'lodash'
import Promise from 'bluebird'

const create = obj => {
  let resolve = null
  let reject = null
  const promise = new Promise((r, rj) => {
    resolve = r
    reject = rj
  })

  const messageId = 'microsoft::' + new Date().toISOString() + '::' + Math.random()

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

const createObject = (originalEvent, object) => {
  const data = object.contentType ? { attachments: [object] } : object

  return create({
    platform: 'microsoft',
    type: 'text',
    text: typeof object === 'string' ? object : _.get(data, 'attachments[0].content.text') || object.text || 'N/A',
    user: originalEvent.user,
    raw: {
      session: originalEvent.session,
      message: data
    }
  })
}

const createText = (originalEvent, text) => {
  return createObject(originalEvent, text)
}

module.exports = {
  createText,
  createObject
}
