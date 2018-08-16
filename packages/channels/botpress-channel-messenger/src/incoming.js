import LRU from 'lru-cache'

import Users from './users'
import outgoing from './outgoing'
import _ from 'lodash'

module.exports = (bp, messenger) => {
  const users = Users(bp, messenger)

  const logger = bp.logger

  const messagesCache = LRU({
    max: 10000,
    maxAge: 60 * 60 * 1000
  })

  const preprocessEvent = payload => {
    const userId = payload.sender && payload.sender.id
    const mid = payload.message && payload.message.mid

    if (mid && !messagesCache.has(mid)) {
      // We already processed this message
      payload.alreadyProcessed = true
    } else {
      // Mark it as processed
      messagesCache.set(mid, true)
    }

    return users.getOrFetchUserProfile(userId)
  }

  messenger.on('message', e => {
    preprocessEvent(e).then(profile => {
      // push the message to the incoming middleware
      bp.middlewares.sendIncoming({
        platform: 'facebook',
        type: 'message',
        user: profile,
        text: e.message.text,
        raw: e
      })
    })
  })

  messenger.on('attachment', e => {
    preprocessEvent(e).then(profile => {
      bp.middlewares.sendIncoming({
        platform: 'facebook',
        type: 'attachments',
        user: profile,
        text: e.message.attachments.length + ' attachments',
        raw: e
      })
      e.message.attachments.forEach(att => {
        bp.middlewares.sendIncoming({
          platform: 'facebook',
          type: att.type,
          user: profile,
          text: att.payload.url ? att.payload.url : JSON.stringify(att.payload),
          raw: att
        })
      })
    })
  })

  messenger.on('postback', e => {
    preprocessEvent(e).then(async profile => {
      bp.middlewares.sendIncoming({
        platform: 'facebook',
        type: 'postback',
        user: profile,
        text: e.postback.payload,
        raw: e
      })

      if (e.postback.payload === 'GET_STARTED') {
        const mConfig = messenger.getConfig()

        if (mConfig.displayGetStarted && mConfig.autoResponseOption == 'autoResponseTextRenderer') {
          try {
            const options = mConfig.autoResponseText ? { text: mConfig.autoResponseText } : {}

            await bp.renderers.sendToUser(profile.id, mConfig.autoResponseTextRenderer, options)
          } catch (err) {
            logger.warn('unavailable "autoResponseTextRenderer"')
          }
        }

        if (mConfig.displayGetStarted && mConfig.autoResponseOption == 'autoResponsePostback') {
          bp.middlewares.sendIncoming({
            platform: 'facebook',
            type: 'postback',
            user: profile,
            text: mConfig.autoResponsePostback,
            raw: e
          })
        }
      }
    })
  })

  messenger.on('quick_reply', e => {
    preprocessEvent(e).then(profile => {
      bp.middlewares.sendIncoming({
        platform: 'facebook',
        type: 'quick_reply',
        user: profile,
        text: e.message.quick_reply.payload,
        raw: e
      })
    })
  })

  messenger.on('delivery', e => {
    _.values(outgoing.pending).forEach(pending => {
      const recipient = pending.event.raw.to
      if (e.sender.id === recipient && pending.event.raw.waitDelivery) {
        if (_.includes(e.delivery.mids, pending.mid)) {
          pending.resolve(e)
          delete outgoing.pending[pending.event.__id]
        }
      }
    })

    preprocessEvent(e).then(profile => {
      bp.middlewares.sendIncoming({
        platform: 'facebook',
        type: 'delivery',
        user: profile,
        text: e.delivery.watermark.toString(),
        raw: e
      })
    })
  })

  messenger.on('read', e => {
    _.values(outgoing.pending).forEach(pending => {
      const recipient = pending.event.raw.to
      if (e.sender.id === recipient) {
        if (pending.event.raw.waitRead && pending.timestamp && pending.timestamp <= e.read.watermark) {
          pending.resolve(e)
          delete outgoing.pending[pending.event.__id]
        }
      }
    })

    preprocessEvent(e).then(profile => {
      bp.middlewares.sendIncoming({
        platform: 'facebook',
        type: 'read',
        user: profile,
        text: e.read.watermark.toString(),
        raw: e
      })
    })
  })

  messenger.on('account_linking', e => {
    preprocessEvent(e).then(profile => {
      bp.middlewares.sendIncoming({
        platform: 'facebook',
        type: 'account_linking',
        user: profile,
        text: e.account_linking.authorization_code,
        raw: e
      })
    })
  })

  messenger.on('optin', e => {
    preprocessEvent(e).then(profile => {
      bp.middlewares.sendIncoming({
        platform: 'facebook',
        type: 'optin',
        user: profile,
        text: e.optin.ref,
        raw: e
      })
    })
  })

  messenger.on('referral', e => {
    preprocessEvent(e).then(profile => {
      bp.middlewares.sendIncoming({
        platform: 'facebook',
        type: 'referral',
        user: profile,
        text: e.referral.ref,
        raw: e
      })
    })
  })

  messenger.on('payment', e => {
    preprocessEvent(e).then(profile => {
      bp.middlewares.sendIncoming({
        platform: 'facebook',
        type: 'payment',
        text: 'payment',
        user: profile,
        payment: e.payment,
        raw: e
      })
    })
  })
}
