import axios from 'axios'
import { IO } from 'botpress/sdk'
import { Response } from 'express'
import _, { Dictionary } from 'lodash'
import moment from 'moment'
import assert from 'assert'

import { SDK } from '.'
import { FeedbackItem, Message, MessageGroup, QnAItem } from './typings'

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

const QNA_IDENTIFIER = '__qna__'

const isQna = (event: IO.IncomingEvent): boolean => {
  const intentName = getIntentName(event)
  return intentName.startsWith(QNA_IDENTIFIER)
}

const getQnaIdFromIntentName = (intentName: string): string => {
  return intentName.replace(QNA_IDENTIFIER, '')
}

const getIntentName = (event: IO.IncomingEvent): string => {
  return event.nlu.intent.name
}

const getQnaItemFromEvent = (event: IO.IncomingEvent, qnaItems: QnAItem[]): QnAItem => {
  const intentName = getIntentName(event)
  const qnaId = getQnaIdFromIntentName(intentName)
  return qnaItems.find(item => item.id === qnaId)
}

interface FeedbackItemsResponse extends Response {
  send: (body: FeedbackItem[]) => FeedbackItemsResponse
}

interface SessionResponse extends Response {
  send: (body: MessageGroup[]) => SessionResponse
}

export default async (bp: SDK) => {
  const router = bp.http.createRouterForBot('bot-improvement')

  router.get('/feedback-items', async (req, res: FeedbackItemsResponse) => {
    const botId = req.params.botId

    const knex = bp.database

    const flaggedEvents = await bp.events.findEvents({ botId, feedback: -1 })
    const incomingEventIds = flaggedEvents.map(e => e.incomingEventId)
    const outgoingEvents: IO.StoredEvent[] = await knex
      .from('events')
      .where({ botId, direction: 'outgoing' })
      .whereIn('incomingEventId', incomingEventIds)

    const axiosConfig = await bp.http.getAxiosConfigForBot(req.params.botId, { localUrl: true })
    const qnaItems: QnAItem[] = (await axios.get('/mod/qna/questions', axiosConfig)).data.items

    const feedbackItems = flaggedEvents.map(flaggedEvent => {
      // const replies = outgoingEvents.filter(e => e.incomingEventId === flaggedEvent.incomingEventId)
      const incomingEvent = <IO.IncomingEvent>flaggedEvent.event

      let source: { type: 'qna' | 'goal'; qnaItem?: QnAItem }
      if (isQna(incomingEvent)) {
        const qnaItem = getQnaItemFromEvent(incomingEvent, qnaItems)
        source = { type: 'qna', qnaItem }
      } else {
        source = { type: 'goal' }
      }

      return {
        eventId: flaggedEvent.id,
        sessionId: flaggedEvent.sessionId,
        timestamp: flaggedEvent.event.createdOn,
        user: {},
        source
      }
    })

    res.send(feedbackItems)
  })

  router.get('/sessions/:sessionId', async (req, res: SessionResponse) => {
    const sessionId = req.params.sessionId

    const sessionEvents = await bp.events.findEvents({ sessionId })

    const storedEventsByIncomingEventId = new Map<number, IO.StoredEvent[]>()

    sessionEvents.map(e => {
      const incomingEventId = parseInt(e.incomingEventId)
      if (!storedEventsByIncomingEventId.get(incomingEventId)) {
        storedEventsByIncomingEventId.set(incomingEventId, [])
      }
      storedEventsByIncomingEventId.get(incomingEventId).push(e)
    })

    const messageGroups: MessageGroup[] = []

    for (const [incomingEventId, events] of storedEventsByIncomingEventId) {
      const [incoming, ...replies] = events.sort((a, b) => {
        if (a.direction === 'incoming') {
          return -1
        }
        if (b.direction === 'incoming') {
          return 1
        }
        if (a.createdOn < b.createdOn) {
          return -1
        }
        if (a.createdOn > b.createdOn) {
          return 1
        }
        return 0
      })
      messageGroups.push({
        flagged: incoming.feedback < 0,
        incoming: convertStoredEventToMessage(incoming),
        replies: replies.map(r => convertStoredEventToMessage(r))
      })
    }

    res.send(messageGroups)
  })
}

const convertStoredEventToMessage = (storedEvent: IO.StoredEvent): Message => {
  const event = storedEvent.event
  const payload = event.payload || {}
  const text = event.preview || payload.text || (payload.wrapped && payload.wrapped.text)
  const direction = event.direction === 'outgoing' ? 'out' : 'in'

  let source: 'user' | 'bot' = 'user'
  const flagged = false
  if (direction === 'out') {
    source = 'bot'
    // if (repliesToFlaggedEventIds.includes(storedEvent.id)) {
    //   flagged = true
    // }
  }

  return {
    id: storedEvent.id,
    sessionId: storedEvent.sessionId,
    type: event.type,
    text,
    raw_message: event.payload,
    direction,
    source,
    ts: event.createdOn
  }
}
