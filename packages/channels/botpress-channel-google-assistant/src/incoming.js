// import GOOGLE_ASSISTANT from './index'
const GOOGLE_ASSISTANT = 'googleAssistant'

const preprocessEvent = ({ originalDetectIntentRequest: { payload: { user } } }) =>
  Promise.resolve({ ...user, id: `${GOOGLE_ASSISTANT}:${user.userId}` })

module.exports = (bp, googleAssistant) => {
  googleAssistant.on('message', event => {
    bp.middlewares.sendIncoming({
      platform: GOOGLE_ASSISTANT,
      type: 'message',
      user: event.user,
      text: event.queryResult.queryText,
      raw: event
    })
  })
}
