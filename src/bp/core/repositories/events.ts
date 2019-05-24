import * as sdk from 'botpress/sdk'
import { inject, injectable } from 'inversify'
import _ from 'lodash'

import Database from '../database'
import { TYPES } from '../types'

export interface EventRepository {
  findEvents(fields: Partial<sdk.IO.StoredEvent>, searchParams?: sdk.EventSearchParams)
  pruneUntil(date: Date): Promise<void>
}

export const DefaultSearchParams: sdk.EventSearchParams = {
  sortOrder: [{ column: 'createdOn' }],
  from: 0,
  count: 10
}

const UNLIMITED_ELEMENTS = -1

@injectable()
export class KnexEventRepository implements EventRepository {
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

    if (count !== UNLIMITED_ELEMENTS) {
      query = query.limit(count)
    }

    return query.offset(from).then(rows =>
      rows.map(storedEvent => ({
        ...storedEvent,
        event: this.database.knex.json.get(storedEvent.event)
      }))
    )
  }

  async pruneUntil(date: Date): Promise<void> {
    await this.database
      .knex(this.TABLE_NAME)
      .where(this.database.knex.date.isBefore('createdOn', date))
      .del()
      .then()
  }
}
