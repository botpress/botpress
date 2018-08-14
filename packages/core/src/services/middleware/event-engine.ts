import { inject, injectable, tagged } from 'inversify'
import joi from 'joi'

import { Logger } from '../../misc/interfaces'
import { TYPES } from '../../misc/types'

import middleware, { BotpressEvent } from './middleware'

const incoming = middleware()
const outgoing = middleware()

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

export class ScoppedEventEngine {
  private middleware!: MiddlewareDefinition[]

  constructor(private botId: string, private logger: Logger) {}

  async load(middleware: MiddlewareDefinition[]) {
    this.middleware = middleware
    this.middleware.filter(mw => mw.type === 'incoming').map(mw => this.useMiddleware(mw, incoming))
    this.middleware.filter(mw => mw.type === 'outgoing').map(mw => this.useMiddleware(mw, outgoing))
  }

  private useMiddleware(mw: MiddlewareDefinition, mware: any) {
    this.valideMw(mw)
    mware.use(mw.handler)
  }

  private valideMw(middleware: MiddlewareDefinition) {
    joi.validate(middleware, mwSchema, err => {
      if (err) {
        throw new Error('Could not process middleware. ' + err)
      }
    })
  }

  async sendIncoming(event: BotpressEvent): Promise<any> {
    this.validateEvent(event)
    return Promise.fromCallback(callback => incoming.run(event, callback))
  }

  async sendOutgoing(event: BotpressEvent): Promise<any> {
    this.validateEvent(event)
    return Promise.fromCallback(callback => outgoing.run(event, callback))
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
