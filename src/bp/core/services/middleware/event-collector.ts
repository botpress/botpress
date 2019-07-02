import * as sdk from 'botpress/sdk'
import { KnexExtension } from 'common/knex'
import { ConfigProvider } from 'core/config/config-loader'
import Database from 'core/database'
import { EventRepository } from 'core/repositories'
import { TYPES } from 'core/types'
import { inject, injectable, tagged } from 'inversify'
import Knex from 'knex'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'

import { SessionIdFactory } from '../dialog/session/id-factory'

@injectable()
export class EventCollector {
  private readonly BATCH_SIZE = 100
  private readonly TABLE_NAME = 'events'
  private knex!: Knex & KnexExtension
  private intervalRef
  private currentPromise

  private enabled = false
  private interval!: number
  private retentionPeriod!: number
  private batch: sdk.IO.StoredEvent[] = []
  private ignoredTypes: string[] = []
  private ignoredProperties: string[] = []

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'EventCollector')
    private logger: sdk.Logger,
    @inject(TYPES.EventRepository) private eventRepo: EventRepository,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider
  ) {}

  async initialize(database: Database) {
    const config = (await this.configProvider.getBotpressConfig()).eventCollector
    if (!config || !config.enabled) {
      return
    }

    this.knex = database.knex
    this.interval = ms(config.collectionInterval)
    this.retentionPeriod = ms(config.retentionPeriod)
    this.ignoredTypes = config.ignoredEventTypes || []
    this.ignoredProperties = config.ignoredEventProperties || []
    this.enabled = true
  }

  public storeEvent(event: sdk.IO.OutgoingEvent | sdk.IO.IncomingEvent) {
    if (!this.enabled || this.ignoredTypes.includes(event.type)) {
      return
    }

    const { id, botId, channel, threadId, target, direction } = event

    const incomingEventId = (event as sdk.IO.OutgoingEvent).incomingEventId
    const sessionId = SessionIdFactory.createIdFromEvent(event)

    this.batch.push({
      botId,
      channel,
      threadId,
      target,
      sessionId,
      direction,
      incomingEventId: event.direction === 'outgoing' ? incomingEventId : id,
      event: this.knex.json.set(this.ignoredProperties ? _.omit(event, this.ignoredProperties) : event || {}),
      createdOn: this.knex.date.now()
    })
  }

  public start() {
    if (this.intervalRef || !this.enabled) {
      return
    }
    this.intervalRef = setInterval(this._runTask, this.interval)
  }

  public stop() {
    clearInterval(this.intervalRef)
    this.intervalRef = undefined
    this.logger.info('Stopped')
  }

  private _runTask = async () => {
    if (this.currentPromise || !this.batch.length) {
      return
    }

    const batchCount = this.batch.length >= this.BATCH_SIZE ? this.BATCH_SIZE : this.batch.length
    const elements = this.batch.splice(0, batchCount)

    this.currentPromise = this.knex
      .batchInsert(this.TABLE_NAME, elements, this.BATCH_SIZE)
      .then(async () => {
        await this.runCleanup()
      })
      .catch(err => {
        this.logger.attachError(err).error(`Couldn't store events to the database. Re-queuing elements`)
        this.batch.push(...elements)
      })
      .finally(() => {
        this.currentPromise = undefined
      })
  }

  private async runCleanup() {
    const expiration = moment()
      .subtract(this.retentionPeriod)
      .toDate()

    return this.eventRepo.pruneUntil(expiration)
  }
}
