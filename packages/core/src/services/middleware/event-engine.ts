import { BotpressAPI, BotpressEvent, ChannelOutgoingHandler, MiddlewareDefinition } from 'botpress-module-sdk'
import { Logger } from 'botpress-module-sdk'
import EventEmitter from 'events'
import { inject, injectable, postConstruct, tagged } from 'inversify'
import joi from 'joi'
import _ from 'lodash'
import { Memoize } from 'lodash-decorators'
import { VError } from 'verror'

import { createForGlobalHooks } from '../../api'
import { BotConfig } from '../../config/bot.config'
import { TYPES } from '../../misc/types'
import { CMSService } from '../cms/cms-service'
import { DialogEngine } from '../dialog/engine'
import GhostService from '../ghost/service'
import { Hooks, HookService } from '../hook/hook-service'

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
  threadId: joi.string().optional()
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
  public onAfterIncomingMiddleware: ((event) => Promise<void>) | undefined

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'EventEngine')
    private logger: Logger,
    @inject(TYPES.IsProduction) private isProduction: boolean,
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.CMSService) private cms: CMSService
  ) {}

  private incomingMiddleware: MiddlewareDefinition[] = []
  private outgoingMiddleware: MiddlewareDefinition[] = []

  register(middleware: MiddlewareDefinition) {
    this.validateMiddleware(middleware)
    if (middleware.direction === 'incoming') {
      this.incomingMiddleware.push(middleware)
    } else {
      this.outgoingMiddleware.push(middleware)
    }
  }

  async sendEvent(botId: string, event: BotpressEvent) {
    this.validateEvent(event)
    const { incoming, outgoing } = await this.getBotMiddlewareChains(botId)
    if (event.direction === 'incoming') {
      await incoming.run(event)
      this.onAfterIncomingMiddleware && (await this.onAfterIncomingMiddleware(event))
    } else {
      await outgoing.run(event)
    }
  }

  async sendContent(
    contentId: string,
    destination: { target: string; botId: string; channel: string; threadId?: string }
  ) {
    contentId = contentId.replace(/^#!?/i, '')

    const content = await this.cms.getContentElement(destination.botId, contentId) // TODO handle errors
    const contentType = await this.cms.getContentType(content.contentType)
    let renderedElements = await contentType.renderElement(content.computedData)

    if (!_.isArray(renderedElements)) {
      renderedElements = [renderedElements]
    }

    for (const element of renderedElements) {
      const event = new BotpressEvent({
        direction: 'outgoing',
        payload: element,
        type: 'cms-element',
        botId: destination.botId,
        channel: destination.channel,
        target: destination.target,
        threadId: destination.threadId
      })
      await this.sendEvent(destination.botId, event)
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
