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
    const pageId = payload.recipient && payload.recipient.id
    const mid = payload.message && payload.message.mid

    if (mid && !messagesCache.has(mid)) {
      // We already processed this message
      payload.alreadyProcessed = true
    } else {
      // Mark it as processed
      messagesCache.set(mid, true)
    }

    return users.getOrFetchUserProfile(userId, pageId)
  }

  messenger.on('feed', e => {
    if (!e.post_id) {
      return
    } // ignore changes without a post
    const userId = e.from && e.from.id
    const pageId = e.post_id.split('_')[0]
    if (userId === pageId) {
      return
    } // ignore page actions (e.g. hide post)

    const sendFeedEvent = profile => {
      bp.middlewares.sendIncoming({
        platform: 'facebook',
        type: 'feed',
        user: profile,
        page: { id: pageId },
        object: { id: e.comment_id || e.post_id },
        text: e.message || '',
        raw: e
      })
    }

    users
      .getOrFetchUserProfile(userId, pageId, true)
      .then(sendFeedEvent)
      .catch(async function(error) {
        // this is triggered if user has not authorized the app
        //TODO: Update their profile when they do authorize later..
        const tokens = e.from.name.split(' ')
        const first_name = tokens[0]
        const last_name = e.from.name.substring(tokens[0].length).trim()
        sendFeedEvent(
          await bp.db.saveUser({
            id: userId,
            platform: 'facebook',
            picture_url: null,
            first_name,
            last_name
          })
        )
      })
  })

  messenger.on('message', e => {
    preprocessEvent(e).then(profile => {
      // push the message to the incoming middleware
      bp.middlewares.sendIncoming({
        platform: 'facebook',
        type: 'message',
        user: profile,
        page: e.recipient,
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
        page: e.recipient,
        text: e.message.attachments.length + ' attachments',
        raw: e
      })
      e.message.attachments.forEach(att => {
        bp.middlewares.sendIncoming({
          platform: 'facebook',
          type: att.type,
          user: profile,
          page: e.recipient,
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
        page: e.recipient,
        text: e.postback.payload,
        referral: e.postback.referral || (e.postback.payload == 'GET_STARTED' ? {} : null),
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
            page: e.recipient,
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
        page: e.recipient,
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
        page: e.recipient,
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
        page: e.recipient,
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
        page: e.recipient,
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
        page: e.recipient,
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
        page: e.recipient,
        text: e.referral.ref,
        referral: e.referral,
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
        page: e.recipient,
        payment: e.payment,
        raw: e
      })
    })
  })
}
