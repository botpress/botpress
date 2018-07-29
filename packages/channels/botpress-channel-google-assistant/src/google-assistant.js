import EventEmitter from 'eventemitter2'
// import GOOGLE_ASSISTANT from './index' // TODO: can't import maybe because of mixing import-export syntax
const GOOGLE_ASSISTANT = 'googleAssistant'

class GoogleAssitant extends EventEmitter {
  constructor(bp) {
    super()
    if (!bp) {
      throw new Error('You need to specify botpress and config')
    }

    this._initWebhook(bp)
    this.pendingMessages = {}
  }

  sendText(recipientId, text) {
    this.pendingMessages[recipientId] = [...(this.pendingMessages[recipientId] || []), text]
    return Promise.resolve()
  }

  _initWebhook = bp => {
    bp.getRouter('botpress-channel-ga').post('/', (req, res) => {
      bp.googleAssistant = { ...bp.googleAssistant, req, res }

      const { originalDetectIntentRequest: { payload: { user } } } = req.body
      const event = { ...req.body, user: { ...user, id: `${GOOGLE_ASSISTANT}:${user.userId}` } }
      this._handleEvent('message', event)

      setTimeout(() => {
        res.end(
          JSON.stringify({
            payload: {
              google: {
                expectUserResponse: true,
                richResponse: {
                  items: (this.pendingMessages[event.user.id] || []).map(message => ({
                    simpleResponse: { textToSpeech: message }
                  }))
                }
              }
            }
          })
        )
        delete this.pendingMessages[event.user.id]
      }, 1000)
      bp.googleAssistant = { ...bp.googleAssistant, req: null, res: null }
    })
  }

  _handleEvent(type, event) {
    this.emit(type, event)
  }
}

module.exports = GoogleAssitant
