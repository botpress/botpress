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

    const storedEvents = await bp.events.findEvents({ botId, feedback: -1 })

    const sessions = storedEvents.map(storedEvent => {
      return {
        botId,
        session_id: storedEvent.sessionId,
        timestamp: storedEvent.event.createdOn,
        channel: storedEvent.channel,
        feedback: storedEvent.feedback,
        user: {}
      }
    })

    res.send(sessions)
  })

  router.get('/sessions/:sessionId', async (req, res) => {
    const sessionId = req.params.sessionId

    const storedEvents = await bp.events.findEvents({ sessionId })

    const messages = storedEvents.map(storedEvent => {
      const event = storedEvent.event
      const payload = event.payload || {}
      const text = event.preview || payload.text || (payload.wrapped && payload.wrapped.text)
      const direction = event.direction === 'outgoing' ? 'out' : 'in'

      let source = 'user'
      if (direction === 'out') {
        source = event.payload.agent ? 'agent' : 'bot'
      }

      return {
        session_id: sessionId,
        type: event.type,
        raw_message: event.payload,
        text,
        source,
        direction
        // event.
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

    res.send(messages)
  })
}
