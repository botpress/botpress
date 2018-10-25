import * as sdk from 'botpress/sdk'
import { inject, injectable, tagged } from 'inversify'
import joi from 'joi'
import _ from 'lodash'
import { VError } from 'verror'

import { GhostService } from '..'
import { BotConfig } from '../../config/bot.config'
import { Event } from '../../sdk/impl'
import { TYPES } from '../../types'
import { CMSService } from '../cms/cms-service'
import { Queue } from '../queue'

import { MiddlewareChain } from './middleware'

const directionRegex = /^(incoming|outgoing)$/

const eventSchema = {
  type: joi.string().required(),
  channel: joi.string().required(),
  target: joi.string().required(),
  id: joi.number().required(),
  direction: joi
    .string()
    .regex(directionRegex)
    .required(),
  preview: joi.string().optional(),
  payload: joi.object().required(),
  botId: joi.string().required(),
  threadId: joi.string().optional(),
  flags: joi.any().required()
}

const mwSchema = {
  name: joi.string().required(),
  handler: joi.func().required(),
  description: joi.string().required(),
  direction: joi
    .string()
    .regex(directionRegex)
    .required(),
  order: joi.number().default(0),
  enabled: joi.boolean().default(true)
}

@injectable()
export class EventEngine {
  public onBeforeIncomingMiddleware: ((event) => Promise<void>) | undefined
  public onAfterIncomingMiddleware: ((event) => Promise<void>) | undefined

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'EventEngine')
    private logger: sdk.Logger,
    @inject(TYPES.IsProduction) private isProduction: boolean,
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.CMSService) private cms: CMSService,
    @inject(TYPES.IncomingQueue) private incomingQueue: Queue,
    @inject(TYPES.OutgoingQueue) private outgoingQueue: Queue
  ) {
    this.incomingQueue.subscribe(async event => {
      this.onBeforeIncomingMiddleware && (await this.onBeforeIncomingMiddleware(event))
      const { incoming } = await this.getBotMiddlewareChains(event.botId)
      await incoming.run(event)
      this.onAfterIncomingMiddleware && (await this.onAfterIncomingMiddleware(event))
    })

    this.outgoingQueue.subscribe(async event => {
      const { outgoing } = await this.getBotMiddlewareChains(event.botId)
      await outgoing.run(event)
    })
  }

  private incomingMiddleware: sdk.IO.MiddlewareDefinition[] = []
  private outgoingMiddleware: sdk.IO.MiddlewareDefinition[] = []

  register(middleware: sdk.IO.MiddlewareDefinition) {
    this.validateMiddleware(middleware)
    if (middleware.direction === 'incoming') {
      this.incomingMiddleware.push(middleware)
      this.incomingMiddleware = _.sortBy(this.incomingMiddleware, mw => mw.order)
    } else {
      this.outgoingMiddleware.push(middleware)
      this.outgoingMiddleware = _.sortBy(this.outgoingMiddleware, mw => mw.order)
    }
  }

  async sendEvent(event: sdk.IO.Event) {
    this.validateEvent(event)

    if (event.direction === 'incoming') {
      this.incomingQueue.enqueue(event, 1, false)
    } else {
      this.outgoingQueue.enqueue(event, 1, false)
    }
  }

  async replyToEvent(event: sdk.IO.Event, payloads: any[]) {
    const originalEvent = _.pick(event, 'channel', 'target', 'botId', 'threadId')

    for (const payload of payloads) {
      const replyEvent = Event({
        ...originalEvent,
        direction: 'outgoing',
        type: _.get(payload, 'type', 'default'),
        payload
      })

      await this.sendEvent(replyEvent)
    }
  }

  private async getBotMiddlewareChains(botId: string) {
    const incoming = new MiddlewareChain<sdk.IO.Event>()
    const outgoing = new MiddlewareChain<sdk.IO.Event>()

    // const botConfig = (await this.ghost.forBot(botId).readFileAsObject('/', 'bot.config.json')) as BotConfig

    for (const mw of this.incomingMiddleware) {
      incoming.use(mw.handler)
    }

    for (const mw of this.outgoingMiddleware) {
      outgoing.use(mw.handler)
    }

    /*for (const name of botConfig.imports.incomingMiddleware) {
      const mw = this.incomingMiddleware.find(mw => mw.name === name)
      if (mw) {
        incoming.use(mw.handler)
      }
    }

    for (const name of botConfig.imports.outgoingMiddleware) {
      const mw = this.outgoingMiddleware.find(mw => mw.name === name)
      if (mw) {
        outgoing.use(mw.handler)
      }
    }*/

    return { incoming, outgoing }
  }

  private validateMiddleware(middleware: sdk.IO.MiddlewareDefinition) {
    const result = joi.validate(middleware, mwSchema)
    if (result.error) {
      throw new VError(result.error, 'Invalid middleware definition')
    }
  }

  private validateEvent(event: sdk.IO.Event) {
    if (this.isProduction) {
      // In production we optimize for speed, validation is useful for debugging purposes
      return
    }

    const result = joi.validate(event, eventSchema)
    if (result.error) {
      throw new VError(result.error, 'Invalid Botpress Event')
    }
  }
}
