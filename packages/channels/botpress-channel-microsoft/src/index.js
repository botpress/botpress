import _ from 'lodash'

import { getUserId } from './util'
import UMM from './umm'

const botbuilder = require('botbuilder')
let bot = null

const userAddressKey = userId => `microsoft::${userId}::address`

const outgoingMiddleware = async (event, next) => {
  if (event.platform !== 'microsoft') {
    return next()
  }

  if (event.type !== 'text') {
    return next('Unsupported event type: ' + event.type)
  }

  const session = event.session || event.raw.session

  if (session) {
    await session.send(event.raw.message)
  } else {
    const userId = getUserId(event).replace('microsoft:', '')
    const address = await event.bp.kvs.get(userAddressKey(userId))

    if (!address) {
      return next(
        'Bot Framework currently only support replies to messages and you need to provide the original <session> in the outgoing event'
      )
    }

    const msg = Object.assign({}, event.raw.message, { address: address })
    await bot.send(msg)
  }

  return event._resolve && event._resolve()
}

module.exports = {
  config: {
    appId: { type: 'string', required: true, env: 'MICROSOFT_APP_ID' },
    appPassword: { type: 'string', required: true, env: 'MICROSOFT_APP_PASSWORD' }
  },

  init: function(bp) {
    bp.middlewares.register({
      name: 'microsoft.sendMessages',
      type: 'outgoing',
      order: 100,
      handler: outgoingMiddleware,
      module: 'botpress-channel-microsoft',
      description:
        'Sends out messages that targets platform = microsoft.' +
        ' This middleware should be placed at the end as it swallows events once sent.'
    })

    UMM(bp)
  },

  ready: async function(bp, configurator) {
    const config = await configurator.loadAll()
    const { appId, appPassword } = config

    if (!appId || !appPassword) {
      return bp.logger.error(
        '[channel-microsoft] "appId" and "appPassword" are required for Microsoft Bot Framework to work'
      )
    }

    const connector = new botbuilder.ChatConnector({
      appId,
      appPassword
    })

    bot = new botbuilder.UniversalBot(connector).set('storage', new botbuilder.MemoryBotStorage()) // We use an in-memory storage as we're not using storage at all

    const router = bp.getRouter('botpress-channel-microsoft', {
      auth: false
    })

    router.post('/api/messages', connector.listen())
    router.get('/', (req, res) => {
      res.sendStatus(200)
    })

    bot.dialog('/', async function(session) {
      const user = {
        id: _.get(session, 'message.user.id') || _.get(session, 'message.address.user.id'),
        platform: 'microsoft',
        gender: null,
        timezone: null,
        locale: null,
        picture_url: null,
        first_name: _.get(session, 'user.name'),
        last_name: null
      }

      await bp.db.saveUser(user)
      await bp.db.set(userAddressKey(user.id), _.get(session, 'message.address'))

      bp.middlewares.sendIncoming({
        type: session.message.type,
        text: session.message.text || '',
        user: user,
        platform: 'microsoft',
        raw: session.message,
        session: session
      })
    })
  }
}
