import { IO } from 'botpress/sdk'
import _ from 'lodash'
import moment from 'moment'

import { SDK } from '.'

// [
//   {
//     "id": 1,
//     "session_id": 1,
//     "type": "visit",
//     "source": "user",
//     "text": "User visit",
//     "raw_message": { "type": "visit", "text": "User visit", "timezone": 5, "language": "en" },
//     "direction": "in",
//     "ts": "2020-01-23T16:06:36.753Z"
//   },
//   {
//     "id": 2,
//     "session_id": 1,
//     "type": "text",
//     "source": "user",
//     "text": "hello",
//     "raw_message": { "type": "text", "text": "hello" },
//     "direction": "in",
//     "ts": "2020-01-23T16:06:38.751Z"
//   },
//   {
//     "id": 3,
//     "session_id": 1,
//     "type": "typing",
//     "source": "bot",
//     "text": null,
//     "raw_message": { "type": "typing", "value": true },
//     "direction": "out",
//     "ts": "2020-01-23T16:06:39.219Z"
//   },
//   {
//     "id": 4,
//     "session_id": 1,
//     "type": "text",
//     "source": "bot",
//     "text": "Hello, world! I'm bot2",
//     "raw_message": { "type": "text", "markdown": true, "text": "Hello, world! I'm bot2" },
//     "direction": "out",
//     "ts": "2020-01-23T16:06:39.745Z"
//   }
// ]

export default async (bp: SDK) => {
  const router = bp.http.createRouterForBot('bot-improvement')

  router.get('/sessions', async (req, res) => {
    const botId = req.params.botId

    const knex = bp.database

    const flaggedEvents = await bp.events.findEvents({ botId, feedback: -1 })
    const incomingEventIds = flaggedEvents.map(e => e.incomingEventId)
    const outgoingEvents: IO.StoredEvent[] = await knex
      .from('events')
      .where({ botId, direction: 'outgoing' })
      .whereIn('incomingEventId', incomingEventIds)

    const sessions = flaggedEvents.map(storedEvent => {
      const botReplies = outgoingEvents.filter(e => e.incomingEventId === storedEvent.incomingEventId)
      const botReply = _.head(_.orderBy(botReplies, ['id'], ['desc']))

      return {
        botId,
        session_id: storedEvent.sessionId,
        timestamp: storedEvent.event.createdOn,
        channel: storedEvent.channel,
        feedback: storedEvent.feedback,
        user: {},
        botReply
      }
    })

    res.send(sessions)
  })

  router.get('/sessions/:sessionId', async (req, res) => {
    const sessionId = req.params.sessionId

    const sessionEvents = await bp.events.findEvents({ sessionId })
    const flaggedEvents = sessionEvents.filter(e => e.feedback < 0)

    const repliesToFlaggedEventIds = []
    flaggedEvents.map(flaggedEvent => {
      const incomingEventId = flaggedEvent.incomingEventId
      const replies = sessionEvents.filter(e => e.incomingEventId === incomingEventId && e.direction === 'outgoing')
      const lastReply = _.head(_.orderBy(replies, ['id', 'desc']))
      repliesToFlaggedEventIds.push(lastReply.id)
    })

    const messages = sessionEvents.map(storedEvent => {
      const event = storedEvent.event
      const payload = event.payload || {}
      const text = event.preview || payload.text || (payload.wrapped && payload.wrapped.text)
      const direction = event.direction === 'outgoing' ? 'out' : 'in'

      let source = 'user'
      let flagged = false
      if (direction === 'out') {
        source = event.payload.agent ? 'agent' : 'bot'
        if (repliesToFlaggedEventIds.includes(storedEvent.id)) {
          flagged = true
        }
      }

      return {
        session_id: sessionId,
        type: event.type,
        raw_message: event.payload,
        text,
        source,
        direction,
        flagged,
        createdOn: event.createdOn
      }
    })

    // const messageGroupsMap = {}
    // storedEvents.map(e => {
    //   if (e.direction === 'incoming') {
    //     const userMessage = e.event
    //     const messageId = userMessage.id
    //     messageGroupsMap[messageId] = {
    //       userMessage,
    //       botMessages: []
    //     }
    //   } else {
    //     messageGroupsMap[e.incomingEventId!].botMessages.push(e.event)
    //   }
    // })

    // let messageGroups = _.values(messageGroupsMap)
    // messageGroups = _.sortBy(messageGroups, mg => moment(mg.userMessage.createdOn).unix()).reverse()

    const sortedMessages = _.sortBy(messages, m => moment(m.createdOn).unix())
    res.send(sortedMessages)
  })
}
