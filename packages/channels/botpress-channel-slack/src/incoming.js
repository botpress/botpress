import { RTM_EVENTS } from '@slack/client'

import LRU from 'lru-cache'
import _ from 'lodash'
import Users from './users'

const OTHER_RTM_EVENTS = [
  'ACCOUNTS_CHANGED',
  'BOT_ADDED',
  'BOT_CHANGED',
  'CHANNEL_ARCHIVE',
  'CHANNEL_CREATED',
  'CHANNEL_DELETED',
  'CHANNEL_HISTORY_CHANGED',
  'CHANNEL_JOINED',
  'CHANNEL_LEFT',
  'CHANNEL_MARKED',
  'CHANNEL_RENAME',
  'CHANNEL_UNARCHIVE',
  'COMMANDS_CHANGED',
  'DND_UPDATED',
  'DND_UPDATED_USER',
  'EMAIL_DOMAIN_CHANGED',
  'EMOJI_CHANGED',
  'FILE_CHANGE',
  'FILE_COMMENT_ADDED',
  'FILE_COMMENT_DELETED',
  'FILE_COMMENT_EDITED',
  'FILE_CREATED',
  'FILE_DELETED',
  'FILE_PUBLIC',
  'FILE_UNSHARED',
  'GOODBYE',
  'GROUP_ARCHIVE',
  'GROUP_CLOSE',
  'GROUP_HISTORY_CHANGED',
  'GROUP_JOINED',
  'GROUP_LEFT',
  'GROUP_MARKED',
  'GROUP_OPEN',
  'GROUP_RENAME',
  'GROUP_UNARCHIVE',
  'HELLO',
  'IM_CLOSE',
  'IM_CREATED',
  'IM_HISTORY_CHANGED',
  'IM_MARKED',
  'IM_OPEN',
  'MANUAL_PRESENCE_CHANGE',
  'PIN_ADDED',
  'PIN_REMOVED',
  'PREF_CHANGE',
  'PRESENCE_CHANGE',
  'REACTION_REMOVED',
  'RECONNECT_URL',
  'STAR_ADDED',
  'STAR_REMOVED',
  'SUBTEAM_CREATED',
  'SUBTEAM_SELF_ADDED',
  'SUBTEAM_SELF_REMOVED',
  'SUBTEAM_UPDATED',
  'TEAM_DOMAIN_CHANGE',
  'TEAM_JOIN',
  'TEAM_MIGRATION_STARTED',
  'TEAM_PLAN_CHANGE',
  'TEAM_PREF_CHANGE',
  'TEAM_PROFILE_CHANGE',
  'TEAM_PROFILE_DELETE',
  'TEAM_PROFILE_REORDER',
  'TEAM_RENAME',
  'USER_CHANG'
]

const mentionRegex = new RegExp(/<@(\w+)>/gi)

module.exports = (bp, slack) => {
  const users = Users(bp, slack)

  const messagesCache = LRU({
    max: 10000,
    maxAge: 60 * 60 * 1000
  })

  const isButtonAction = payload => {
    return payload.message_ts ? true : false
  }

  const isFromBot = event => {
    if (event.bot_id || event.subtype) {
      return true
    }
    if (event.user === slack.getBotId()) {
      return true
    }

    return false
  }

  const preprocessEvent = payload => {
    let userId = payload.user

    if (isButtonAction(payload)) {
      userId = payload.user.id
    }

    const mid = `${payload.channel}_${payload.user}_${payload.ts}`

    if (mid && !messagesCache.has(mid)) {
      // We already processed this message
      payload.alreadyProcessed = true
    } else {
      // Mark it as processed
      messagesCache.set(mid, true)
    }

    return users.getOrFetchUserProfile(userId)
  }

  const extractBasics = event => {
    return {
      platform: 'slack',
      channel: { id: event.channel },
      ts: event.ts,
      direct: isDirect(event.channel),
      raw: event
    }
  }

  const isDirect = channelId => {
    return /^D/.test(channelId)
  }

  const isBotMentioned = text => {
    let match = []
    while ((match = mentionRegex.exec(text))) {
      const mentionedId = match[1]
      if (mentionedId === slack.getBotId()) {
        return true
      }
    }

    return false
  }

  const router = bp.getRouter('botpress-slack', { auth: req => !/\/action-endpoint/i.test(req.originalUrl) })

  router.post('/action-endpoint', (req, res) => {
    const payload = JSON.parse(req.body.payload)

    if (!slack.isConnected()) {
      throw new Error('You are not connected and authenticated')
    }

    if (payload.token !== slack.config.verificationToken) {
      throw new Error('Verification token are not matching')
    }

    preprocessEvent(payload).then(user => {
      // Check if this is a button or a menu action
      let action_type = 'button'
      let action_text = ' clicked on a button'
      if (payload.actions[0].selected_options) {
        action_type = 'menu'
        action_text = ' selected a menu option'
      }

      bp.middlewares.sendIncoming({
        platform: 'slack',
        type: 'action',
        text: user.profile.real_name + action_text,
        user: user,
        channel: payload.channel,
        action: payload.actions[0],
        action_type: action_type,
        callback_id: payload.callback_id,
        ts: payload.message_ts,
        action_ts: payload.action_ts,
        direct: isDirect(payload.channel.id),
        raw: payload
      })

      // DEPRECATED for 1.0
      bp.middlewares.sendIncoming({
        platform: 'slack',
        type: 'button',
        text: user.profile.real_name + ' clicked on a button',
        user: user,
        channel: payload.channel,
        button: payload.actions[0],
        callback_id: payload.callback_id,
        ts: payload.message_ts,
        direct: isDirect(payload.channel.id),
        raw: payload
      })
    })

    res.status(200).end()
  })

  slack.rtm.on(RTM_EVENTS['MESSAGE'], function handleRtmMessage(message) {
    if (isFromBot(message)) return

    preprocessEvent(message).then(user => {
      bp.middlewares.sendIncoming({
        type: 'message',
        text: message.text,
        user: user,
        bot_mentioned: isBotMentioned(message.text),
        ...extractBasics(message)
      })

      let match = []
      while ((match = mentionRegex.exec(message.text))) {
        const mentionedId = match[1]
        if (mentionedId === slack.getBotId()) {
          bp.middlewares.sendIncoming({
            type: 'bot_mentioned',
            bot_mentioned: true,
            text: 'Bot has been mentioned',
            user: user,
            mentionedId: mentionedId,
            ...extractBasics(message)
          })
        } else {
          bp.middlewares.sendIncoming({
            type: 'user_mentioned',
            user_mentioned: true,
            text: 'User has been mentioned',
            user: user,
            mentionedId: mentionedId,
            ...extractBasics(message)
          })
        }
      }
    })
  })

  slack.rtm.on(RTM_EVENTS['REACTION_ADDED'], function handleRtmReactionAdded(reaction) {
    if (isFromBot(reaction)) return

    preprocessEvent(reaction).then(user => {
      bp.middlewares.sendIncoming({
        type: 'reaction',
        user: user,
        text: user.profile.real_name + ' reacted using ' + reaction.reaction,
        reaction: reaction.reaction,
        ...extractBasics(reaction),
        ts: reaction.event_ts
      })
    })
  })

  slack.rtm.on(RTM_EVENTS['USER_TYPING'], function handleRtmTypingAdded(typing) {
    if (isFromBot(typing)) return

    preprocessEvent(typing).then(user => {
      bp.middlewares.sendIncoming({
        type: 'typing',
        user: user,
        text: user.profile.real_name + ' is typing',
        ...extractBasics(typing)
      })
    })
  })

  slack.rtm.on(RTM_EVENTS['FILE_SHARED'], function handleRtmTypingAdded(file) {
    if (isFromBot(file)) return

    users.getOrFetchUserProfile(file.user_id).then(user => {
      bp.middlewares.sendIncoming({
        platform: 'slack',
        type: 'file',
        user: user,
        text: user.profile.real_name + ' shared a file',
        file: file.file,
        ts: file.event_ts,
        raw: file
      })
    })
  })

  OTHER_RTM_EVENTS.map(rtmEvent => {
    slack.rtm.on(RTM_EVENTS[rtmEvent], function handleOtherRTMevent(event) {
      bp.middlewares.sendIncoming({
        platform: 'slack',
        type: event.type,
        text: 'An another type of event occured',
        raw: event
      })
    })
  })
}
