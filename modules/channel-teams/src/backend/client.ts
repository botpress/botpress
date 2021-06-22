import { Activity, ActivityTypes, BotFrameworkAdapter, ConversationReference, TurnContext } from 'botbuilder'
import { MicrosoftAppCredentials } from 'botframework-connector'
import * as sdk from 'botpress/sdk'
import { ChannelRenderer, ChannelSender } from 'common/channel'
import { Request, Response } from 'express'
import _ from 'lodash'
import { Config } from '../config'
import {
  TeamsCardRenderer,
  TeamsCarouselRenderer,
  TeamsChoicesRenderer,
  TeamsImageRenderer,
  TeamsTextRenderer,
  TeamsDropdownRenderer
} from '../renderers'
import { TeamsCommonSender, TeamsTypingSender } from '../senders'

import { Clients, TeamsContext } from './typings'

export class TeamsClient {
  private inMemoryConversationRefs: _.Dictionary<Partial<ConversationReference>> = {}
  private adapter: BotFrameworkAdapter
  private logger: sdk.Logger
  private renderers: ChannelRenderer<TeamsContext>[]
  private senders: ChannelSender<TeamsContext>[]

  constructor(private bp: typeof sdk, private botId: string, private config: Config, private publicPath: string) {
    this.logger = bp.logger.forBot(this.botId)
  }

  async initialize() {
    if (!this.config.appId || !this.config.appPassword) {
      return this.logger.error(
        `[${this.botId}] You need to set the appId and the appPassword before enabling this channel. It will be disabled for this bot.`
      )
    }

    if (!(await this.validateCredentials())) {
      return this.logger.error(
        `[${this.botId}] Could not validate the specified credentials.
Make sure that your appId and appPassword are valid.
If you have a restricted app, you may need to specify the tenantId also.`
      )
    }

    this.bp.logger.info(
      `[${this.botId}] Successfully validated credentials for Microsoft Teams channel with App ID: ${this.config.appId}`
    )

    if (!this.publicPath || this.publicPath.indexOf('https://') !== 0) {
      return this.logger.error(
        `[${this.botId}] You need to configure an HTTPS url for this channel to work properly. See EXTERNAL_URL in botpress config.`
      )
    }

    this.logger.info(`[${this.botId}] Messaging API URL: ${this.publicPath.replace('BOT_ID', this.botId)}/api/messages`)

    this.adapter = new BotFrameworkAdapter({
      appId: this.config.appId,
      appPassword: this.config.appPassword,
      channelAuthTenant: this.config.tenantId
    })

    this.renderers = [
      new TeamsCardRenderer(),
      new TeamsTextRenderer(),
      new TeamsImageRenderer(),
      new TeamsCarouselRenderer(),
      new TeamsDropdownRenderer(),
      new TeamsChoicesRenderer()
    ]
    this.senders = [new TeamsTypingSender(), new TeamsCommonSender()]
  }

  async receiveIncomingEvent(req: Request, res: Response) {
    await this.adapter.processActivity(req, res, async turnContext => {
      const { activity } = turnContext

      const conversationReference = TurnContext.getConversationReference(activity)
      const threadId = conversationReference.conversation.id

      if (activity.value?.text) {
        activity.text = activity.value.text
      }

      if (this._botAddedToConversation(activity)) {
        // Locale format: {lang}-{subtag1}-{subtag2}-... https://en.wikipedia.org/wiki/IETF_language_tag
        // TODO: Use Intl.Locale().language once its types are part of TS. See: https://github.com/microsoft/TypeScript/issues/37326
        const lang = activity.locale?.split('-')[0]
        await this._sendProactiveMessage(activity, conversationReference, lang)
      } else if (activity.text) {
        await this._sendIncomingEvent(activity, threadId)
      }

      await this._setConversationRef(threadId, conversationReference)
    })
  }

  private async validateCredentials() {
    try {
      const credentials = new MicrosoftAppCredentials(this.config.appId, this.config.appPassword, this.config.tenantId)
      const token = await credentials.getToken()
      return token && !!token.length
    } catch (err) {
      return false
    }
  }

  /**
   * Determine whether the bot has just been added to the conversation or not
   */
  private _botAddedToConversation(activity: Activity): boolean {
    // https://docs.microsoft.com/en-us/previous-versions/azure/bot-service/dotnet/bot-builder-dotnet-activities?view=azure-bot-service-3.0#conversationupdate
    return (
      activity.type === ActivityTypes.ConversationUpdate &&
      activity.membersAdded?.some(member => member.id === activity.recipient.id)
    )
  }

  private async _getConversationRef(threadId: string): Promise<Partial<ConversationReference>> {
    let convRef = this.inMemoryConversationRefs[threadId]
    if (convRef) {
      return convRef
    }

    // cache miss
    convRef = await this.bp.kvs.forBot(this.botId).get(threadId)
    this.inMemoryConversationRefs[threadId] = convRef
    return convRef
  }

  private async _setConversationRef(threadId: string, convRef: Partial<ConversationReference>): Promise<void> {
    if (this.inMemoryConversationRefs[threadId]) {
      return
    }

    this.inMemoryConversationRefs[threadId] = convRef
    return this.bp.kvs.forBot(this.botId).set(threadId, convRef)
  }

  async _sendProactiveMessage(
    activity: Activity,
    conversationReference: Partial<ConversationReference>,
    lang?: string
  ): Promise<void> {
    const defaultLanguage = (await this.bp.bots.getBotById(this.botId)).defaultLanguage
    const proactiveMessages = this.config.proactiveMessages || {}
    const message = (lang && proactiveMessages[lang]) || proactiveMessages[defaultLanguage]

    if (message) {
      conversationReference.serviceUrl && MicrosoftAppCredentials.trustServiceUrl(conversationReference.serviceUrl)
      await this.adapter.continueConversation(conversationReference, async turnContext => {
        await turnContext.sendActivity(message)
      })

      const convoId = await this.getLocalConvo(conversationReference.conversation.id, activity.from.id)
      await this.bp.experimental.messages.forBot(this.botId).create(convoId, { type: 'text', text: message })
    }
  }

  private _sendIncomingEvent = async (activity: Activity, threadId: string) => {
    const {
      text,
      from: { id: userId }
    } = activity

    const convoId = await this.getLocalConvo(threadId, userId)

    const type = activity.value?.renderer === 'choices' ? 'quick_reply' : 'text'

    await this.bp.experimental.messages.forBot(this.botId).receive(convoId, { type, text }, { channel: 'teams' })
  }

  private async getLocalConvo(threadId: string, userId: string): Promise<string> {
    let convoId = await this.bp.experimental.conversations
      .forBot(this.botId)
      .getLocalId('teams', `${threadId}&${userId}`)

    if (!convoId) {
      const conversation = await this.bp.experimental.conversations.forBot(this.botId).create(userId)
      convoId = conversation.id

      await this.bp.experimental.conversations
        .forBot(this.botId)
        .createMapping('teams', conversation.id, `${threadId}&${userId}`)
    }

    return convoId
  }

  public async sendOutgoingEvent(event: sdk.IO.OutgoingEvent): Promise<void> {
    const foreignId = await this.bp.experimental.conversations.forBot(this.botId).getForeignId('teams', event.threadId)
    const [threadId, userId] = foreignId.split('&')

    const convoRef = await this._getConversationRef(threadId)
    if (!convoRef) {
      this.bp.logger.warn(
        `[${this.botId}] No message could be sent to MS Botframework with threadId: ${threadId} as there is no conversation reference`
      )
      return
    }

    const context: TeamsContext = {
      bp: this.bp,
      event,
      client: this.adapter,
      handlers: [],
      payload: _.cloneDeep(event.payload),
      botUrl: process.EXTERNAL_URL,
      messages: [],
      threadId,
      convoRef
    }

    for (const renderer of this.renderers) {
      if (renderer.handles(context)) {
        renderer.render(context)
        context.handlers.push(renderer.id)
      }
    }

    for (const sender of this.senders) {
      if (sender.handles(context)) {
        await sender.send(context)
      }
    }

    await this.bp.experimental.messages
      .forBot(event.botId)
      .create(event.threadId, event.payload, undefined, event.id, event.incomingEventId)
  }
}

export async function setupMiddleware(bp: typeof sdk, clients: Clients) {
  bp.events.registerMiddleware({
    description:
      'Sends out messages that targets platform = teams.' +
      ' This middleware should be placed at the end as it swallows events once sent.',
    direction: 'outgoing',
    handler: outgoingHandler(clients),
    name: 'teams.sendMessages',
    order: 100
  })
}

const outgoingHandler = (clients: Clients) => async (event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback) => {
  if (event.channel !== 'teams') {
    return next()
  }

  const client: TeamsClient = clients[event.botId]
  if (!client) {
    return next()
  }

  try {
    await client.sendOutgoingEvent(event)
  } catch (err) {
    next(err)
  }

  next(undefined, false)
}
