import * as sdk from 'botpress/sdk'
import Database from 'core/database'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'

export const DefaultSearchParams: sdk.EventSearchParams = {
  sortOrder: [{ column: 'createdOn' }],
  from: 0,
  count: 10
}

const UNLIMITED_ELEMENTS = -1

@injectable()
export class EventRepository {
  private readonly TABLE_NAME = 'events'

  constructor(@inject(TYPES.Database) private database: Database) {}

  async findEvents(
    fields: Partial<sdk.IO.StoredEvent>,
    params: sdk.EventSearchParams = DefaultSearchParams
  ): Promise<sdk.IO.StoredEvent[]> {
    if (!fields || !Object.keys(fields).length) {
      throw new Error('At least one field is required')
    }

    const { sortOrder, count, from } = params

    let query = this.database.knex(this.TABLE_NAME)
    query = query.where(fields)

    sortOrder &&
      sortOrder.forEach(sort => {
        query = query.orderBy(sort.column, sort.desc ? 'desc' : 'asc')
      })

    if (count && count !== UNLIMITED_ELEMENTS) {
      query = query.limit(count)
    }

    if (from) {
      query = query.offset(from)
    }

    return query.then(rows =>
      rows.map(storedEvent => ({
        ...storedEvent,
        event: this.database.knex.json.get(storedEvent.event)
      }))
    )
  }

  async updateEvent(id: string, fields: Partial<sdk.IO.StoredEvent>): Promise<void> {
    await this.database
      .knex(this.TABLE_NAME)
      .where({ id })
      .update(fields)
  }

  async pruneUntil(date: Date): Promise<void> {
    await this.database
      .knex(this.TABLE_NAME)
      .where(this.database.knex.date.isBefore('createdOn', date))
      .del()
      .then()
  }

  async saveUserFeedback(incomingEventId: string, target: string, feedback: number, type?: string): Promise<boolean> {
    const events = await this.findEvents({ incomingEventId, target, direction: 'incoming' }, { count: 1 })
    if (!events?.length) {
      return false
    }

    const storedEvent = events[0]
    const incomingEvent = storedEvent.event as sdk.IO.IncomingEvent

    await this.updateEvent(storedEvent.id, {feedback})

    if (type) {
      const details = incomingEvent.decision?.sourceDetails
      const metric = feedback === 1 ? 'bp_core_feedback_positive' : 'bp_core_feedback_negative'

      BOTPRESS_CORE_EVENT(metric, {
        botId: storedEvent.botId,
        channel: storedEvent.channel,
        type,
        eventId: storedEvent.id,
        details
      })
    }

    return true
  }
}
