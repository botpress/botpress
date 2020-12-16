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
import _ from 'lodash'

import { Config } from '../config'

import { Clients } from './typings'

const outgoingTypes = ['message', 'typing', 'carousel', 'text', 'dropdown_choice']

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

    this.bp.logger.info(
      `Successfully validated credentials for Microsoft Teams channel with App ID: ${this.config.appId}`
    )

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

      const conversationReference = TurnContext.getConversationReference(activity)
      if (activity.value?.text) {
        activity.text = activity.value.text
      }
      if (!activity.text) {
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
    const { text, from, type } = activity

    await this.bp.events.sendEvent(
      this.bp.IO.Event({
        botId: this.botId,
        channel: 'teams',
        direction: 'incoming',
        payload: { text },
        preview: text,
        threadId,
        target: from.id,
        type
      })
    )
  }

  public async sendOutgoingEvent(event: sdk.IO.Event): Promise<void> {
    const messageType = event.type === 'default' ? 'text' : event.type

    if (!_.includes(outgoingTypes, messageType)) {
      throw new Error(`Unsupported event type: ${event.type}`)
    }

    const ref = await this._getConversationRef(event.threadId)
    if (!ref) {
      this.bp.logger.warn(
        `No message could be sent to MS Botframework with threadId: ${event.threadId} as there is no conversation reference`
      )
      return
    }

    let msg: any = event.payload // TODO: place this logic in builtin with content-types
    if (msg.type === 'typing') {
      msg = {
        type: 'typing'
      }
    } else if (msg.type === 'carousel') {
      msg = this._prepareCarouselPayload(event)
    } else if (msg.quick_replies && msg.quick_replies.length) {
      msg = this._prepareChoicePayload(event)
    } else if (msg.type === 'dropdown_choice') {
      msg = this._prepareDropdownPayload(event)
    }

    try {
      await this.adapter.continueConversation(ref, async (turnContext: TurnContext) => {
        await turnContext.sendActivity(msg)
      })
    } catch (err) {
      this.logger.attachError(err).error(`Error while sending payload of type "${msg.type}" `)
    }
  }

  private _prepareChoicePayload(event: sdk.IO.Event) {
    return {
      text: event.payload.text,
      attachments: [
        CardFactory.heroCard(
          '',
          CardFactory.images([]),
          CardFactory.actions(
            event.payload.quick_replies.map(reply => {
              return {
                title: reply.title,
                type: 'messageBack',
                value: reply.payload,
                text: reply.payload,
                displayText: reply.title
              }
            })
          )
        )
      ]
    }
  }

  private _prepareDropdownPayload(event: sdk.IO.Event) {
    return {
      type: 'message',
      attachments: [
        CardFactory.adaptiveCard({
          type: 'AdaptiveCard',
          body: [
            {
              type: 'TextBlock',
              size: 'Medium',
              weight: 'Bolder',
              text: event.payload.message
            },
            {
              type: 'Input.ChoiceSet',
              choices: event.payload.options.map((opt, idx) => ({
                title: opt.label,
                id: `choice-${idx}`,
                value: opt.value
              })),
              id: 'text',
              placeholder: 'Select a choice',
              wrap: true
            }
          ],
          actions: [
            {
              type: 'Action.Submit',
              title: event.payload.buttonText,
              id: 'btnSubmit'
            }
          ],
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          version: '1.2'
        })
      ]
    }
  }

  private _prepareCarouselPayload(event: sdk.IO.Event) {
    return {
      type: 'message',
      attachments: event.payload.elements.map(card => {
        const contentUrl = card.picture

        return CardFactory.heroCard(
          card.title,
          CardFactory.images([contentUrl]),
          CardFactory.actions(
            card.buttons.map(button => {
              if (button.type === 'open_url') {
                return {
                  type: 'openUrl',
                  value: button.url,
                  title: button.title
                }
              } else if (button.type === 'say_something') {
                return {
                  type: 'messageBack',
                  title: button.title,
                  value: button.text,
                  text: button.text,
                  displayText: button.text
                }
              } else if (button.type === 'postback') {
                return {
                  type: 'messageBack',
                  title: button.title,
                  value: button.payload,
                  text: button.payload
                }
              }
            })
          )
        )
      }),
      attachmentLayout: AttachmentLayoutTypes.Carousel
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
