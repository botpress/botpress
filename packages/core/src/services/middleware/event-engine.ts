import 'bluebird-global'
import { MiddlewareDefinition } from 'botpress-module-sdk'
import { inject, injectable, tagged } from 'inversify'
import joi from 'joi'
import { VError } from 'verror'

import { Logger } from '../../misc/interfaces'
import { TYPES } from '../../misc/types'

import { MiddlewareManager } from './middleware'

/**
 * @property {string} type - The type of the event, i.e. image, text, timeout, etc
 * @property {string} channel - The channel of communication, i.e web, messenger, twillio
 * @property {string} target - The target of the event for a specific plateform, i.e
 */
export type BotpressEvent = {
  type: string
  channel: string
  target: string
  direction: string
  text?: string
  raw?: string
}

const incoming = MiddlewareManager()
const outgoing = MiddlewareManager()

const eventSchema = {
  type: joi.string().required(),
  channel: joi.string().required(),
  target: joi.string().required(),
  direction: joi
    .string()
    .regex(/(incoming|outgoing)/g)
    .required(),
  text: joi.string().optional(),
  raw: joi.object().optional()
}

const mwSchema = {
  name: joi.string().required(),
  handler: joi.func().required(),
  description: joi.string().required(),
  direction: joi
    .string()
    .regex(/(incoming|outgoing)/g)
    .required(),
  order: joi.number().default(0),
  enabled: joi.boolean().default(true)
}

export class ScopedEventEngine {
  private middleware!: MiddlewareDefinition[]

  constructor(private botId: string, private logger: Logger) {}

  async load(middleware: MiddlewareDefinition[]) {
    this.middleware = middleware
    this.middleware.filter(mw => mw.direction === 'incoming').map(mw => this.useMiddleware(mw, incoming))
    this.middleware.filter(mw => mw.direction === 'outgoing').map(mw => this.useMiddleware(mw, outgoing))
  }

  private useMiddleware(mw: MiddlewareDefinition, manager) {
    this.valideMw(mw)
    manager.use(mw.handler)
  }

  private valideMw(middleware: MiddlewareDefinition) {
    joi.validate(middleware, mwSchema, err => {
      if (err) {
        throw new VError(err, `Invalid middleware function`)
      }
    })
  }

  async sendIncoming(event: BotpressEvent): Promise<any> {
    this.validateEvent(event)
    return await Promise.fromCallback(callback => incoming.run([event], callback))
  }

  async sendOutgoing(event: BotpressEvent): Promise<any> {
    this.validateEvent(event)
    return await Promise.fromCallback(callback => outgoing.run([event], callback))
  }

  private validateEvent(event: BotpressEvent) {
    joi.validate(event, eventSchema, err => {
      if (err) {
        throw new VError(err, `Invalid Botpress Event`)
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

  forBot(botId: string): ScopedEventEngine {
    return new ScopedEventEngine(botId, this.logger)
  }
}
