import UMM from './umm'
import incoming from './incoming'
import outgoing from './outgoing'
import GoogleAssistant from './google-assistant'

export const GOOGLE_ASSISTANT = 'googleAssistant'
let googleAssistant = null

async function outgoingHandler(event, next) {
  if (event.platform !== GOOGLE_ASSISTANT) {
    return next()
  }

  if (!outgoing[event.type]) {
    return next('Unsupported event type: ' + event.type)
  }

  outgoing[event.type](event, next, googleAssistant)
}

const initializeGoogleAssistant = async (bp, config) => {
  googleAssistant = new GoogleAssistant(bp, config)
}

module.exports = {
  config: {},

  init: function(bp) {
    bp.middlewares.register({
      name: 'googleAssistant.sendMessages',
      type: 'outgoing',
      order: 100,
      handler: outgoingHandler,
      module: 'botpress-platform-googleAssistant',
      description: 'googleAssistant.sendMessages'
    })

    UMM(bp)
  },

  ready: async function(bp, config) {
    await initializeGoogleAssistant(bp, config)
    incoming(bp, googleAssistant)
  }
}
