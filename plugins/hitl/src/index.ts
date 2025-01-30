import * as actions from './actions'
import * as hooks from './hooks'
import * as bp from '.botpress'

const bot = new bp.Plugin({
  actions: {
    startHitl: actions.startHitl,
    stopHitl: actions.stopHitl,
  },
})

bot.on.beforeIncomingMessage('*', hooks.handleMessage)

export default bot
