import { BotpressEvent, ChannelOutgoingHandler, MiddlewareDefinition } from 'botpress-module-sdk'
import { Logger } from 'botpress-module-sdk'
import EventEmitter from 'events'
import { inject, injectable, postConstruct, tagged } from 'inversify'
import joi from 'joi'
import { Memoize } from 'lodash-decorators'
import { VError } from 'verror'

import { BotConfig } from '../../config/bot.config'
import { TYPES } from '../../misc/types'
import GhostService from '../ghost/service'

import { MiddlewareChain } from './middleware'

const directionRegex = /^(incoming|outgoing)$/

const eventSchema = {
  type: joi.string().required(),
  channel: joi.string().required(),
  target: joi.string().required(),
  direction: joi
    .string()
    .regex(directionRegex)
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
    .regex(directionRegex)
    .required(),
  order: joi.number().default(0),
  enabled: joi.boolean().default(true)
}

@injectable()
export class EventEngine {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'EventEngine')
    private logger: Logger,
    @inject(TYPES.GhostService) private ghost: GhostService
  ) {}

  private outgoingChannelHandlers: ChannelOutgoingHandler[] = []
  private incomingMiddleware: MiddlewareDefinition[] = []
  private outgoingMiddleware: MiddlewareDefinition[] = []
  private emitter: EventEmitter = new EventEmitter()

  register(middleware: MiddlewareDefinition) {
    this.validateMiddleware(middleware)
    if (middleware.direction === 'incoming') {
      this.incomingMiddleware.push(middleware)
    } else {
      this.outgoingMiddleware.push(middleware)
    }
  }

  registerOutgoingChannelHandler(channelHandler: ChannelOutgoingHandler): any {
    if (this.outgoingChannelHandlers.find(x => x.channel.toLowerCase() === channelHandler.channel.toLowerCase())) {
      throw new Error(`Duplicated outgoing handler for channel "${channelHandler.channel}"`)
    }

    this.outgoingChannelHandlers.push(channelHandler)
  }

  async sendEvent(botId: string, event: BotpressEvent) {
    this.validateEvent(event)
    const { incoming, outgoing } = await this.getBotMiddlewareChains(botId)
    if (event.direction === 'incoming') {
      await incoming.run(event)
    } else {
      await outgoing.run(event)
    }
  }

  @Memoize()
  private async getBotMiddlewareChains(botId: string) {
    const incoming = new MiddlewareChain<BotpressEvent>()
    const outgoing = new MiddlewareChain<BotpressEvent>()

    const botConfig = (await this.ghost.forBot(botId).readFileAsObject('/', 'bot.config.json')) as BotConfig

    for (const mw of this.incomingMiddleware) {
      if (botConfig.imports.incomingMiddleware.includes(mw.name)) {
        incoming.use(mw.handler)
      }
    }

    for (const mw of this.outgoingMiddleware) {
      if (botConfig.imports.outgoingMiddleware.includes(mw.name)) {
        outgoing.use(mw.handler)
      }
    }

    return { incoming, outgoing }
  }

  private validateMiddleware(middleware: MiddlewareDefinition) {
    const result = joi.validate(middleware, mwSchema)
    if (result.error) {
      throw new VError(result.error, 'Invalid middleware definition')
    }
  }

  private validateEvent(event: BotpressEvent) {
    const result = joi.validate(event, eventSchema)
    if (result.error) {
      throw new VError(result.error, 'Invalid Botpress Event')
    }
  }
}
