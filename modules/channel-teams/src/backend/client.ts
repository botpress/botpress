import {
  Activity,
  AttachmentLayoutTypes,
  BotFrameworkAdapter,
  CardFactory,
  ConversationReference,
  TurnContext
} from 'botbuilder'
import { MicrosoftAppCredentials } from 'botframework-connector'
import * as sdk from 'botpress/sdk'
import { isValidOutgoingType, parseTyping } from 'common/channels'
import _ from 'lodash'

import { Config } from '../config'

import { convertPayload } from './renderer'
import { Clients } from './typings'

const debug = DEBUG('channel-teams')
const debugIncoming = debug.sub('incoming')
const debugOutgoing = debug.sub('outgoing')

export class TeamsClient {
  private inMemoryConversationRefs: _.Dictionary<Partial<ConversationReference>> = {}
  private adapter: BotFrameworkAdapter
  private logger: sdk.Logger

  constructor(private bp: typeof sdk, private botId: string, private config: Config, private publicPath: string) {
    this.logger = bp.logger.forBot(this.botId)
  }

  async initialize() {
    if (!this.config.appId || !this.config.appPassword) {
      return this.logger.error(
        'You need to set the appId and the appPassword before enabling this channel. It will be disabled for this bot.'
      )
    }

    if (!(await this.validateCredentials())) {
      return this.logger.error(
        `Could not validate the specified credentials.
Make sure that your appId and appPassword are valid.
If you have a restricted app, you may need to specify the tenantId also.`
      )
    }

    if (!this.publicPath || this.publicPath.indexOf('https://') !== 0) {
      return this.logger.error(
        'You need to configure an HTTPS url for this channel to work properly. See EXTERNAL_URL in botpress config.'
      )
    }

    this.logger.info(`Messaging API URL: ${this.publicPath.replace('BOT_ID', this.botId)}/api/messages`)

    this.adapter = new BotFrameworkAdapter({
      appId: this.config.appId,
      appPassword: this.config.appPassword,
      channelAuthTenant: this.config.tenantId
    })
  }

  async receiveIncomingEvent(req, res) {
    await this.adapter.processActivity(req, res, async turnContext => {
      const { activity } = turnContext

      debugIncoming('Received message %o', activity)

      const conversationReference = TurnContext.getConversationReference(activity)
      if (!activity.text && !activity.value) {
        // To prevent from emojis reactions to launch actual events
        return
      }

      const threadId = conversationReference.conversation.id
      await this._setConversationRef(threadId, conversationReference)

      await this._sendIncomingEvent(activity, threadId)
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

  private _sendIncomingEvent = async (activity: Activity, threadId: string) => {
    const { text, from, channelData } = activity

    let payload: any = { type: 'text', text }

    if (channelData.postBack) {
      payload = { type: 'quick_reply', text, payload: text }
    }

    await this.bp.events.sendEvent(
      this.bp.IO.Event({
        botId: this.botId,
        channel: 'teams',
        direction: 'incoming',
        payload,
        threadId,
        target: from.id,
        type: payload.type
      })
    )
  }

  public async sendOutgoingEvent(event: sdk.IO.Event): Promise<void> {
    debugOutgoing('Sending message %o', event)

    if (!isValidOutgoingType(event.type)) {
      throw new Error(`Unsupported event type: ${event.type}`)
    }

    const ref = await this._getConversationRef(event.threadId)
    if (!ref) {
      this.bp.logger.warn(
        `No message could be sent to MS Botframework with threadId: ${event.threadId} as there is no conversation reference`
      )
      return
    }

    const { __typing, __suggestions } = event.payload.metadata as sdk.Content.Metadata
    let payload: any = convertPayload(event.payload)

    if (__typing) {
      await this.sendActivity(ref, { type: 'typing' })
      await Promise.delay(parseTyping(__typing))
    }

    if (__suggestions) {
      payload = {
        ...payload,
        attachments: [
          CardFactory.heroCard(
            '',
            CardFactory.images([]),
            CardFactory.actions(
              __suggestions.map(reply => {
                return {
                  title: reply.label,
                  type: 'postBack',
                  value: reply.value,
                  text: reply.value,
                  displayText: reply.label
                }
              })
            )
          )
        ]
      }
    }

    await this.sendActivity(ref, payload)
  }

  private async sendActivity(ref, payload: any) {
    try {
      await this.adapter.continueConversation(ref, async (turnContext: TurnContext) => {
        await turnContext.sendActivity(payload)
      })
    } catch (err) {
      this.logger.attachError(err).error(`Error while sending payload of type "${payload.type}" `)
    }
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
