import { MiddlewareDefinition } from 'botpress-module-sdk'
import { inject, injectable, tagged } from 'inversify'
import joi from 'joi'
import mware, { Event } from 'mware-ts'

import { Logger } from '../../misc/interfaces'
import { TYPES } from '../../misc/types'

const { use, run } = mware()

type DirectionType = 'incoming' | 'outgoing'

/**
 * @property {string} type - The type of the event, i.e. image, text, timeout, etc
 * @property {string} channel - The channel of communication, i.e web, messenger, twillio
 * @property {string} target - The target of the event for a specific plateform, i.e
 */
type BotpressEvent = {
  name: string
  type: string
  channel: string
  target: string
  direction: DirectionType
  text: string
  raw: string
}

const eventSchema = {
  name: joi.string().required(),
  type: joi.string().required(),
  channel: joi.string().required(),
  target: joi.string().required(),
  direction: joi
    .string()
    .required()
    .regex(/(incoming|outgoing)/g)
}

const mwSchema = {
  name: joi.string().required(),
  handler: joi.string().required(),
  type: joi
    .string()
    .required()
    .regex(/(incoming|outgoing)/g),
  order: joi.number().default(0),
  enabled: joi.boolean().default(true)
}

class ScoppedEventEngine {
  private middleware!: MiddlewareDefinition[]

  // TODO: Enqueue by bot
  constructor(private botId: string, private logger: Logger) {}

  async registerMiddleware(middleware: MiddlewareDefinition[]) {
    this.middleware = middleware
    middleware.filter(mw => mw.type === 'incoming').forEach(mw => this.useMiddleware(mw))
    middleware.filter(mw => mw.type === 'outgoing').forEach(mw => this.useMiddleware(mw))
  }

  private useMiddleware(mw: MiddlewareDefinition) {
    this.valideMw(mw)
    use(async (event, value) => {
      const mw = this.middleware.find(mw => mw.name === event.name)
      if (!mw) {
        throw new Error(`Could not find any registered middleware for "${event.name}"`)
      }
      return value
    })
  }

  private valideMw(middleware: MiddlewareDefinition) {
    joi.validate(middleware, mwSchema, err => {
      if (err) {
        throw new Error('Could not process middleware. ' + err)
      }
    })
  }

  async sendIncoming(event: BotpressEvent) {
    this.validateEvent(event)
    return run(new Event(event.name), event)
  }

  async sendOutgoing(event: BotpressEvent): Promise<any> {
    this.validateEvent(event)
    return run(new Event(event.name), event)
  }

  private validateEvent(event: BotpressEvent) {
    joi.validate(event, eventSchema, err => {
      if (err) {
        throw new Error('Could not process botpress event. ' + err)
      }
    })
  }
}

@injectable()
export class EventEngine {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'EventEngine')
    private logger: Logger
  ) {}

  async forBot(botId: string): Promise<ScoppedEventEngine> {
    return new ScoppedEventEngine(botId, this.logger)
  }
}
