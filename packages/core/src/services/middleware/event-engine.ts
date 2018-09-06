import { BotpressEvent, MiddlewareDefinition } from 'botpress-module-sdk'
import { Logger } from 'botpress-module-sdk'
import { inject, injectable, tagged } from 'inversify'
import joi from 'joi'
import _ from 'lodash'
import { Memoize } from 'lodash-decorators'
import { VError } from 'verror'

import { BotConfig } from '../../config/bot.config'
import { TYPES } from '../../misc/types'
import { CMSService } from '../cms/cms-service'
import GhostService from '../ghost/service'
import { Queue } from '../queue'

import { MiddlewareChain } from './middleware'

const MESSAGE_RETRIES = 3

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
  public onAfterIncomingMiddleware: ((event) => Promise<void>) | undefined

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'EventEngine')
    private logger: Logger,
    @inject(TYPES.IsProduction) private isProduction: boolean,
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.CMSService) private cms: CMSService,
    @inject(TYPES.IncomingQueue) private incomingQueue: Queue,
    @inject(TYPES.OutgoingQueue) private outgoingQueue: Queue
  ) {
    this.incomingQueue.subscribe(async event => {
      const { incoming } = await this.getBotMiddlewareChains(event.botId)
      await incoming.run(event)
      this.onAfterIncomingMiddleware && (await this.onAfterIncomingMiddleware(event))
    })

    this.outgoingQueue.subscribe(async event => {
      const { outgoing } = await this.getBotMiddlewareChains(event.botId)
      await outgoing.run(event)
    })
  }

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

    if (event.direction === 'incoming') {
      this.incomingQueue.enqueue(event, MESSAGE_RETRIES, false)
    } else {
      this.outgoingQueue.enqueue(event, MESSAGE_RETRIES, false)
    }
  }

  async sendContent(
    contentId: string,
    destination: { target: string; botId: string; channel: string; threadId?: string }
  ) {
    contentId = contentId.replace(/^#!?/i, '')

    const content = await this.cms.getContentElement(destination.botId, contentId) // TODO handle errors

    if (!content) {
      throw new Error(`Content element "${contentId}" not found`)
    }

    const contentType = await this.cms.getContentType(content.contentType)
    let renderedElements = await contentType.renderElement(content.computedData, destination.channel)

    if (!_.isArray(renderedElements)) {
      renderedElements = [renderedElements]
    }

    for (const element of renderedElements) {
      const event = new BotpressEvent({
        direction: 'outgoing',
        payload: element,
        type: _.get(element, 'type', 'default'),
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
