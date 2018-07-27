import UMM from './umm'
import incoming from './incoming'
import outgoing from './outgoing'
import GoogleAssistant from './google-assistant'

export const GOOGLE_ASSISTANT = 'google-assistant'
let googleAssistant = null

const outgoingMiddleware = () => (event, next) => {
  if (event.platform !== GOOGLE_ASSISTANT) {
    return next()
  }
}

const initializeGoogleAssistant = async (bp, config) => {
  googleAssistant = new GoogleAssistant(bp, config)
}

module.exports = {
  config: {},

  init: async function(bp) {
    bp.middlewares.register({
      name: 'googleAssistant.sendMessages',
      type: 'outgoing',
      order: 100,
      handler: outgoingMiddleware,
      module: 'botpress-google-assistant',
      description: ''
    })

    bp.googleAssistant = {}

    UMM(bp)
  },

  ready: async function(bp, config) {
    await initializeGoogleAssistant(bp, config)
    incoming(bp, googleAssistant)
    bp.googleAssistant._internal = googleAssistant
  }
}
