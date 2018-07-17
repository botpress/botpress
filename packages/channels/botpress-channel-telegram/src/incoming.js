import LRU from 'lru-cache'

const messageEventTypes = [
  //  'text',
  'audio',
  'document',
  'photo',
  'sticker',
  'video',
  'voice',
  'contact',
  'location'
]

const actionEventTypes = [
  'new_chat_participant',
  'left_chat_participant',
  'new_chat_title',
  'new_chat_photo',
  'delete_chat_photo',
  'group_chat_created',
  'edited_message',
  //  'edited_message_text',
  'edited_message_caption',
  'channel_post',
  'edited_channel_post',
  'edited_channel_post_text',
  'edited_channel_post_caption,',
  'inline_query',
  'chosen_inline_result'
  //  'callback_query',
]

module.exports = (bp, telegram) => {
  const messagesCache = LRU({
    max: 10000,
    maxAge: 60 * 60 * 1000
  })

  const preprocessEvent = payload => {
    console.log('preprocessEvent')
    const mid = `${payload.chat.id}_${payload.from.id}_${payload.date}`
    console.log(mid)
    const idExist = payload.from && payload.from.id
    const hasTelegram = typeof payload.from.id === 'string' && payload.from.id.startsWith('telegram:')

    if (idExist && (typeof payload.from.id === 'number' || !hasTelegram)) {
      payload.from.userId = payload.from.id
      payload.from.id = `telegram:${payload.from.id}`
    }

    if (mid && !messagesCache.has(mid)) {
      payload.alreadyProcessed = true
    } else {
      messagesCache.set(mid, true)
    }

    return payload
  }

  const extractBasics = event => {
    return {
      platform: 'telegram',
      raw: event
    }
  }

  const _handleEvent = (event, eventType) => {
    event = {
      type: eventType,
      ...extractBasics(preprocessEvent(event))
    }
    bp.middlewares.sendIncoming(event)
  }

  telegram.bot.on('text', event => {
    event.from.userId = event.from.id
    event.from.id = `telegram:${event.from.id}`

    bp.middlewares.sendIncoming({
      type: 'text',
      chat: event.chat,
      user: event.from,
      text: event.text,
      ...extractBasics(event)
    })
  })

  telegram.bot.on('callback_query', event => {
    bp.middlewares.sendIncoming({
      type: 'callback_query',
      data: event.data,
      query_id: event.id,
      chat_id: event.message.chat.id,
      user_id: event.message.from.id,
      message_id: event.message.message_id,
      text: 'null',
      ...extractBasics(event)
    })
  })

  messageEventTypes.map(eventType => {
    telegram.bot.on(eventType, event => {
      _handleEvent(event, eventType)
    })
  })

  actionEventTypes.map(eventType => {
    telegram.bot.on(eventType, event => {
      _handleEvent(event, eventType)
    })
  })

  telegram.bot.on('polling_error', error => {
    console.log(error)
  })
}
