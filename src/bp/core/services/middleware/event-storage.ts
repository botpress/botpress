import * as sdk from 'botpress/sdk'
import { KnexExtension } from 'common/knex'
import { BotpressConfig } from 'core/config/botpress.config'
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
export class EventStorage {
  private readonly BATCH_SIZE = 10
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
    @tagged('name', 'EventStorage')
    private logger: sdk.Logger,
    @inject(TYPES.EventRepository) private eventRepo: EventRepository
  ) {}

  async initialize(botpressConfig: BotpressConfig, database: Database) {
    const config = _.get(botpressConfig, 'eventStorage')
    if (!config || !config.enabled) {
      return
    }

    this.knex = database.knex
    this.interval = ms(config.storageInterval)
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

    this.currentPromise = this.knex
      .batchInsert(this.TABLE_NAME, this.batch, this.BATCH_SIZE)
      .then(() => {
        if (this.batch.length >= this.BATCH_SIZE) {
          this.batch.splice(0, this.BATCH_SIZE)
        } else {
          this.batch.splice(0, this.batch.length)
        }
      })
      .catch(err => this.logger.attachError(err).error(`Couldn't store events to the database`))
      .finally(() => {
        this.currentPromise = undefined
      })
  }

  private runCleanup() {
    const expiration = moment()
      .subtract(this.retentionPeriod)
      .toDate()

    this.eventRepo.deleteBeforeDate(expiration)
  }
}
