import axios from 'axios'
import { IO } from 'botpress/sdk'
import { Response } from 'express'
import _ from 'lodash'

import { SDK } from '.'
import { sortStoredEvents } from './helpers'
import { FeedbackItem, Message, MessageGroup, QnAItem } from './typings'

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

export default async (bp: SDK) => {
  const router = bp.http.createRouterForBot('bot-improvement')

  router.get('/feedback-items', async (req, res: FeedbackItemsResponse) => {
    const botId = req.params.botId
    const knex = bp.database

    const flaggedEvents = await knex
      .column({ eventId: 'events.id' }, 'events.event', 'events.sessionId')
      .select()
      .from('events')
      .leftJoin('bot_improvement_feedback_items', {
        'events.id': 'bot_improvement_feedback_items.eventId'
      })
      .where({ botId, feedback: -1 })
      .then(rows =>
        rows.map(storedEvent => ({
          ...storedEvent,
          event: knex.json.get(storedEvent.event)
        }))
      )

    const axiosConfig = await bp.http.getAxiosConfigForBot(req.params.botId, { localUrl: true })
    const qnaItems: QnAItem[] = (await axios.get('/mod/qna/questions', axiosConfig)).data.items

    const feedbackItems = flaggedEvents.map(flaggedEvent => {
      const incomingEvent = <IO.IncomingEvent>flaggedEvent.event

      let source: { type: 'qna' | 'goal'; qnaItem?: QnAItem }
      if (isQna(incomingEvent)) {
        const qnaItem = getQnaItemFromEvent(incomingEvent, qnaItems)
        source = { type: 'qna', qnaItem }
      } else {
        source = { type: 'goal' }
      }

      return {
        eventId: flaggedEvent.eventId,
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

    const sessionEvents = await bp.events.findEvents({ sessionId }, { count: -1 })

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
      const [incoming, ...replies] = events.sort(sortStoredEvents)
      messageGroups.push({
        incoming: convertStoredEventToMessage(incoming),
        replies: replies.map(r => convertStoredEventToMessage(r))
      })
    }

    res.send(messageGroups)
  })
}
