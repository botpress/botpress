import { GOOGLE_ASSISTANT } from './index'

const preprocessEvent = payload => {
  const user = payload.originalDetectIntentRequest.payload.user
  user.userId = user.id
  user.id = `${GOOGLE_ASSISTANT}:${user.userId}`

  return Promise.resolve(user)
}

module.exports = (bp, googleAssistant) => {
  googleAssistant.on('message', event => {
    preprocessEvent(event).then(profile => {
      bp.middlewares.sendIncoming({
        platform: GOOGLE_ASSISTANT,
        type: 'message',
        user: profile,
        text: event.queryResult.queryText,
        raw: event
      })
    })
  })
}
