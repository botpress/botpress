import { TelemetryEntry } from 'common/telemetry'
import { ConfigProvider } from 'core/config'
import Database from 'core/database'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import _ from 'lodash'
import moment from 'moment'

const DEFAULT_ENTRIES_LIMIT = 1000

@injectable()
export class TelemetryRepository {
  private readonly tableName = 'telemetry'

  constructor(
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.ConfigProvider) private config: ConfigProvider
  ) {}

  async refreshAvailability(): Promise<void> {
    const time = moment()
      .subtract(5, 'minute')
      .toDate()

    const events = await this.database.knex
      .from(this.tableName)
      .select('uuid')
      .where(this.database.knex.date.isBefore('lastChanged', time))

    const uuIds = events.map(event => event.uuid)

    await this.updateAvailability(uuIds, true)
  }

  async updateAvailability(uuIds: string[], status: boolean): Promise<void> {
    if (!uuIds.length) {
      return
    }

    await Promise.mapSeries(_.chunk(uuIds, 500), async uuIdChunk => {
      await this.database
        .knex(this.tableName)
        .whereIn('uuid', uuIdChunk)
        .update({
          available: this.database.knex.bool.parse(status),
          lastChanged: this.database.knex.date.now()
        })
    })
  }

  async pruneEntries(): Promise<void> {
    const config = await this.config.getBotpressConfig()
    const offset = config.telemetry?.entriesLimit ?? DEFAULT_ENTRIES_LIMIT

    const uuIds = await this.database.knex
      .from(this.tableName)
      .select('uuid')
      .orderBy('creationDate', 'desc')
      .offset(offset)
      .then(rows => rows.map(entry => entry.uuid))

    return this.removeMany(uuIds)
  }

  async removeMany(uuIds: string[]): Promise<void> {
    await Promise.mapSeries(_.chunk(uuIds, 500), async uuIdChunk => {
      await this.database
        .knex(this.tableName)
        .whereIn('uuid', uuIdChunk)
        .del()
    })
  }

  async getEntries(): Promise<TelemetryEntry[]> {
    const events = await this.database.knex
      .from(this.tableName)
      .select('*')
      .where('available', this.database.knex.bool.true())
      .limit(200)

    if (events.length > 0) {
      const uuIds = events.map(event => event.uuid)
      await this.updateAvailability(uuIds, this.database.knex.bool.false())
    }

    return events.map(event => this.database.knex.json.get(event.payload))
  }

  async insertPayload(uuid: string, payload: JSON) {
    await this.database.knex(this.tableName).insert({
      uuid,
      payload: this.database.knex.json.set(payload),
      available: this.database.knex.bool.true(),
      lastChanged: this.database.knex.date.now(),
      creationDate: this.database.knex.date.now()
    })

    await this.pruneEntries()
  }

  async getEntry(uuid: string): Promise<TelemetryEntry> {
    return this.database.knex
      .from(this.tableName)
      .select('*')
      .where('uuid', uuid)
      .first()
  }

  async removePayload(uuid: string): Promise<void> {
    await this.database
      .knex(this.tableName)
      .where({ uuid })
      .del()
  }
}
