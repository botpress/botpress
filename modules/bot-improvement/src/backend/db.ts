import axios from 'axios'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { getGoalFromEvent } from './helpers'
import { CorrectedActionType, FeedbackItem, FeedbackItemStatus, Goal, Message, MessageGroup, QnAItem } from './typings'

const QNA_IDENTIFIER = '__qna__'

interface UpdateFeedbackItemProps {
  eventId: string
  status: FeedbackItemStatus
  correctedActionType: CorrectedActionType
  correctedObjectId: string
}

export interface Database {
  initialize: () => Promise<void>
  getFeedbackItems: (botId: string) => Promise<FeedbackItem[]>
  updateFeedbackItem: (props: UpdateFeedbackItemProps) => Promise<void>
  getMessageGroups: (sessionId: string) => Promise<MessageGroup[]>
}

const isQna = (event: sdk.IO.IncomingEvent): boolean => {
  const intentName = getIntentName(event)
  return intentName.startsWith(QNA_IDENTIFIER)
}

const getQnaIdFromIntentName = (intentName: string): string => {
  return intentName.replace(QNA_IDENTIFIER, '')
}

const getIntentName = (event: sdk.IO.IncomingEvent): string => {
  return event.nlu?.intent?.name || ''
}

const getQnaItemFromEvent = (event: sdk.IO.IncomingEvent, qnaItems: QnAItem[]): QnAItem => {
  const intentName = getIntentName(event)
  const qnaId = getQnaIdFromIntentName(intentName)
  return qnaItems.find(item => item.id === qnaId)
}

const convertStoredEventToMessage = ({ id, event, sessionId }: sdk.IO.StoredEvent): Message => {
  const payload = event.payload || {}
  const text = event.preview || payload.text || (payload.wrapped && payload.wrapped.text)
  const direction = event.direction === 'outgoing' ? 'out' : 'in'

  let source: 'user' | 'bot' = 'user'
  if (direction === 'out') {
    source = 'bot'
  }

  return {
    id,
    sessionId,
    type: event.type,
    text,
    raw_message: event.payload,
    direction,
    source,
    ts: event.createdOn
  }
}

export default (bp: typeof sdk): Database => {
  const knex = bp.database

  const initialize = async () => {
    await knex.createTableIfNotExists('bot_improvement_feedback_items', table => {
      table.increments('id').primary()
      table
        .integer('eventId')
        .unsigned()
        .notNullable()
      table.string('status').notNullable()
      table.string('correctedActionType').notNullable()
      table.string('correctedObjectId').notNullable()
    })
  }

  const getFeedbackItems = async (botId: string) => {
    const flaggedEvents = await knex
      .column(
        { eventId: 'events.id' },
        'events.event',
        'events.sessionId',
        'bot_improvement_feedback_items.status',
        'bot_improvement_feedback_items.correctedActionType',
        'bot_improvement_feedback_items.correctedObjectId'
      )
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

    const axiosConfig = await bp.http.getAxiosConfigForBot(botId, { localUrl: true })

    let qnaItems: QnAItem[]
    try {
      qnaItems = (await axios.get('/qna/questions', axiosConfig)).data.items
    } catch (e) {
      bp.logger.attachError(e).error('Could not fetch QnA questions')
    }

    const feedbackItems = flaggedEvents.map(flaggedEvent => {
      const incomingEvent = <sdk.IO.IncomingEvent>flaggedEvent.event

      let source: { type: 'qna' | 'goal'; qnaItem?: QnAItem; goal?: Goal }
      if (isQna(incomingEvent)) {
        const qnaItem = getQnaItemFromEvent(incomingEvent, qnaItems)
        source = { type: 'qna', qnaItem }
      } else {
        const goal = getGoalFromEvent(incomingEvent)
        source = { type: 'goal', goal }
      }

      return {
        eventId: flaggedEvent.eventId,
        sessionId: flaggedEvent.sessionId,
        timestamp: flaggedEvent.event.createdOn,
        user: {},
        source,
        status: flaggedEvent.status,
        correctedActionType: flaggedEvent.correctedActionType,
        correctedObjectId: flaggedEvent.correctedObjectId
      }
    })

    return feedbackItems
  }

  const updateFeedbackItem = async (props: UpdateFeedbackItemProps) => {
    const { eventId, status, correctedActionType, correctedObjectId } = props
    const result = await knex('bot_improvement_feedback_items')
      .where({ eventId })
      .update({ status, correctedActionType, correctedObjectId })
    if (!result) {
      await knex('bot_improvement_feedback_items').insert({ eventId, status, correctedActionType, correctedObjectId })
    }
  }

  const getMessageGroups = async (sessionId: string) => {
    const sessionEvents: sdk.IO.StoredEvent[] = await bp.events.findEvents({ sessionId }, { count: -1 })

    const storedEventsByIncomingEventId = _.groupBy(sessionEvents, 'incomingEventId')

    const messageGroups: MessageGroup[] = Object.values(storedEventsByIncomingEventId).map(events => {
      const [incoming, ...replies] = _.sortBy(events, ['direction', 'asc'], ['event.createdOn', 'asc'])
      return {
        incoming: convertStoredEventToMessage(incoming),
        replies: replies.map(r => convertStoredEventToMessage(r))
      }
    })
    return messageGroups
  }

  return { initialize, getFeedbackItems, updateFeedbackItem, getMessageGroups }
}
