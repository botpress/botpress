import * as sdk from 'botpress/sdk'
import Knex from 'knex'
import { get, pick } from 'lodash'

import {
  DbFlaggedEvent,
  FLAG_REASON,
  FLAGGED_MESSAGE_STATUS,
  FLAGGED_MESSAGE_STATUSES,
  FlaggedEvent,
  RESOLUTION_TYPE,
  ResolutionData
} from '../types'

import applyChanges from './applyChanges'

const TABLE_NAME = 'misunderstood'
const EVENTS_TABLE_NAME = 'events'

export default class Db {
  knex: Knex & sdk.KnexExtension

  constructor(private bp: typeof sdk) {
    this.knex = bp.database
  }

  async initialize() {
    await this.knex.createTableIfNotExists(TABLE_NAME, table => {
      table.increments('id')
      table.string('eventId')
      table.string('botId')
      table.string('language')
      table.string('preview')
      table.enum('reason', Object.values(FLAG_REASON))
      table.enum('status', FLAGGED_MESSAGE_STATUSES).defaultTo(FLAGGED_MESSAGE_STATUS.new)
      table.enum('resolutionType', Object.values(RESOLUTION_TYPE))
      table.string('resolution')
      table.json('resolutionParams')
      table.timestamp('createdAt').defaultTo(this.knex.fn.now())
      table.timestamp('updatedAt').defaultTo(this.knex.fn.now())
    })
  }

  async addEvent(event: FlaggedEvent) {
    await this.knex(TABLE_NAME).insert(event)
  }

  async updateStatus(botId: string, id: string, status: FLAGGED_MESSAGE_STATUS, resolutionData?: ResolutionData) {
    if (status !== FLAGGED_MESSAGE_STATUS.pending) {
      resolutionData = { resolutionType: null, resolution: null, resolutionParams: null }
    } else {
      resolutionData = pick(resolutionData, 'resolutionType', 'resolution', 'resolutionParams')
    }

    await this.knex(TABLE_NAME)
      .where({ botId, id })
      .update({ status, ...resolutionData, updatedAt: this.knex.fn.now() })
  }

  async listEvents(botId: string, language: string, status: FLAGGED_MESSAGE_STATUS): Promise<DbFlaggedEvent[]> {
    const data: DbFlaggedEvent[] = await this.knex(TABLE_NAME)
      .select('*')
      .where({ botId, language, status })
      .orderBy('updatedAt', 'desc')

    return data.map((event: DbFlaggedEvent) => ({
      ...event,
      resolutionParams:
        event.resolutionParams && typeof event.resolutionParams !== 'object'
          ? JSON.parse(event.resolutionParams)
          : event.resolutionParams
    }))
  }

  async countEvents(botId: string, language: string) {
    const data: { status: string; count: number }[] = await this.knex(TABLE_NAME)
      .where({ botId, language })
      .select('status')
      .count({ count: 'id' })
      .groupBy('status')

    return data.reduce((acc, row) => {
      acc[row.status] = Number(row.count)
      return acc
    }, {})
  }

  async getEventDetails(botId: string, id: string) {
    const event = await this.knex(TABLE_NAME)
      .where({ botId, id })
      .limit(1)
      .select('*')
      .then((data: DbFlaggedEvent[]) => (data && data.length ? data[0] : null))

    const { threadId, sessionId, id: messageId, event: eventDetails } = await this.knex(EVENTS_TABLE_NAME)
      .where({ botId, incomingEventId: event.eventId, direction: 'incoming' })
      .select('id', 'threadId', 'sessionId', 'event')
      .limit(1)
      .first()

    const [messagesBefore, messagesAfter] = await Promise.all([
      this.knex(EVENTS_TABLE_NAME)
        .where({ botId, threadId, sessionId })
        .andWhere('id', '<=', messageId)
        .orderBy('id', 'desc')
        .limit(3)
        .select('id', 'event'),
      this.knex(EVENTS_TABLE_NAME)
        .where({ botId, threadId, sessionId })
        .andWhere('id', '>', messageId)
        .orderBy('id', 'asc')
        .limit(3)
        .select('id', 'event')
    ])

    const context = [...messagesBefore, ...messagesAfter]
      .sort((e1, e2) => e1.id - e2.id)
      .map(({ id, event }) => {
        const eventObj = typeof event === 'string' ? JSON.parse(event) : event
        return {
          direction: eventObj.direction,
          preview: (eventObj.preview || '').replace(/<[^>]*>?/gm, ''),
          payloadMessage: get(eventObj, 'payload.message'),
          isCurrent: id === messageId
        }
      })

    const parsedEventDetails =
      eventDetails && typeof eventDetails !== 'object' ? JSON.parse(eventDetails) : eventDetails

    return {
      ...event,
      resolutionParams:
        event.resolutionParams && typeof event.resolutionParams !== 'object'
          ? JSON.parse(event.resolutionParams)
          : event.resolutionParams,
      context,
      nluContexts: (parsedEventDetails && parsedEventDetails.nlu && parsedEventDetails.nlu.includedContexts) || []
    }
  }

  applyChanges(botId: string) {
    return applyChanges(this.bp, botId, TABLE_NAME)
  }
}
