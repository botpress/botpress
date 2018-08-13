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
  // TODO: Enqueue by bot
  constructor(private botId: string, private logger: Logger) {}

  async registerMiddleware(middleware: MiddlewareDefinition[]) {
    middleware.filter(mw => mw.type === 'incoming').forEach(mw => this.useMiddleware(mw))
    middleware.filter(mw => mw.type === 'outgoing').forEach(mw => this.useMiddleware(mw))
  }

  private useMiddleware(mw: MiddlewareDefinition) {
    try {
      this.valideMw(mw)
    } catch (err) {
      this.logger.error(err)
    }
    use(async () => mw.handler)
  }

  private valideMw(middleware: MiddlewareDefinition) {
    joi.validate(middleware, mwSchema, err => {
      if (err) {
        throw new Error('Could not process middleware. ' + err)
      }
    })
  }

  async sendIncoming(event: BotpressEvent) {
    try {
      this.validateEvent(event)
    } catch (err) {
      this.logger.error(err)
    }
    return run(new Event(event.name))
  }

  async sendOutgoing(event: BotpressEvent): Promise<any> {
    try {
      this.validateEvent(event)
    } catch (err) {
      this.logger.error(err)
    }
    return run(new Event(event.name))
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
