import _ from 'lodash'
import Promise from 'bluebird'

import users from './users'
import db from './db'

const outgoingTypes = ['text', 'login_prompt', 'file', 'carousel', 'custom']

module.exports = async bp => {
  const knex = bp.database.knex

  console.log('====>', knex)

  const { appendBotMessage, getOrCreateRecentConversation } = db(knex)
  const { getOrCreateUser } = await users(bp)

  const { botName = 'Bot', botAvatarUrl = null } = config || {} // FIXME

  bp.middlewares.register({
    name: 'webchat.sendMessages',
    type: 'outgoing',
    order: 100,
    handler: outgoingHandler,
    module: 'botpress-platform-webchat',
    description:
      'Sends out messages that targets platform = webchat.' +
      ' This middleware should be placed at the end as it swallows events once sent.'
  })

  async function outgoingHandler(event, next) {
    if (event.platform !== 'webchat') {
      return next()
    }

    if (!_.includes(outgoingTypes, event.type)) {
      return next('Unsupported event type: ' + event.type)
    }

    // FIXME Get User Id from Event (target)
    const userId = (event.user && event.user.id) || event.raw.to
    const user = await getOrCreateUser(userId) // FIXME Take botId

    const typing = parseTyping(event)

    const conversationId = _.get(event, 'raw.conversationId') || (await getOrCreateRecentConversation(user.id)) // FIXME botId

    const socketId = user.userId.replace(/webchat:/gi, '')

    if (typing) {
      bp.events.emit('guest.webchat.typing', {
        // FIXME Doesn't exist
        timeInMs: typing,
        userId: null,
        __room: 'visitor:' + socketId,
        conversationId
      })

      await Promise.delay(typing)
    }

    // FIXME botId
    const message = await appendBotMessage(botName, botAvatarUrl, conversationId, event)

    Object.assign(message, {
      __room: 'visitor:' + socketId // This is used to send to the relevant user's socket
    })

    // FIXME botId
    bp.events.emit('guest.webchat.message', message)

    // Resolve the event promise
    // FIXME Make official API (BotpressAPI.events.updateStatus(event.id, 'done'))
    event._promise && event._resolve && event._resolve()
  }
}

function parseTyping(msg) {
  if (msg.raw && !!msg.raw.typing) {
    if (isNaN(msg.raw.typing)) {
      return 1000
    } else {
      return Math.max(msg.raw.typing, 500)
    }
  }

  return false
}
