import { BotFrameworkAdapter, ConversationReference, CardFactory, TurnContext, AttachmentLayoutTypes } from 'botbuilder'

import * as sdk from 'botpress/sdk'
import { Router } from 'express'
import _ from 'lodash'

import { Config } from '../config'

import { Clients } from './typings'

const outgoingTypes = ['message', 'typing', 'carousel', 'text']

export class TeamsClient {
  private conversationsRefs: _.Dictionary<Partial<ConversationReference>> = {}
  private adapter: BotFrameworkAdapter
  constructor(private bp: typeof sdk, private botId: string, private config: Config, private router: Router) {}

  async initialize() {
    this.adapter = new BotFrameworkAdapter({
      appId: this.config.microsoftAppId,
      appPassword: this.config.microsoftAppPassword
    })

    this.router.post('/api/messages', async (req, res) => {
      await this.adapter.processActivity(req, res, async turnContext => {
        const conversationReference = TurnContext.getConversationReference(turnContext.activity)

        const threadId = conversationReference.conversation.id
        this.conversationsRefs[threadId] = conversationReference
        sendIncomingEvent(this.bp, this.botId, turnContext, threadId, { type: turnContext.activity.type })
      })
    })
  }

  async sendOutgoingEvent(event: sdk.IO.Event): Promise<Error | void> {
    const messageType = event.type === 'default' ? 'text' : event.type

    if (!_.includes(outgoingTypes, messageType)) {
      return new Error('Unsupported event type: ' + event.type)
    }

    const ref = this.conversationsRefs[event.threadId]

    let msg: any = event.payload
    if (msg.type === 'typing') {
      msg = {
        type: 'typing'
      }
    } else if (msg.type === 'carousel') {
      msg = this._sendCarousel(event)
    } else if (msg.quick_replies && msg.quick_replies.length) {
      msg = this._sendChoice(event)
    }

    await this.adapter.continueConversation(ref, async (turnContext: TurnContext) => {
      try {
        await turnContext.sendActivity(msg)
      } catch (err) {
        this.bp.logger.error(err.message, err)
      }
    })
  }

  // TODO: place this logic in builtin with content-types
  private _sendChoice(event: sdk.IO.Event) {
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

  // TODO: place this logic in builtin with content-types
  private _sendCarousel(event: sdk.IO.Event) {
    return {
      type: 'message',
      attachments: event.payload.elements.map(card => {
        let contentUrl = card.picture

        // RETIRER
        if (true) {
          const base = 'https://141d2bcf.ngrok.io/'
          contentUrl = contentUrl.replace('http://localhost:3000/', base)
        }
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

const sendIncomingEvent = (
  bp: typeof sdk,
  botId: string,
  ctx: TurnContext,
  threadId: string,
  args: { type: string }
) => {
  bp.events.sendEvent(
    bp.IO.Event({
      botId,
      channel: 'teams',
      direction: 'incoming',
      payload: { text: ctx.activity.text },
      preview: ctx.activity.text,
      threadId,
      target: ctx.activity.from.id,
      ...args
    })
  )
}

export async function setupMiddleware(bp: typeof sdk, clients: Clients) {
  registerMiddleware(bp, outgoingHandler(clients))
}

const registerMiddleware = (bp: typeof sdk, outgoingHandler) => {
  bp.events.registerMiddleware({
    description:
      'Sends out messages that targets platform = teams.' +
      ' This middleware should be placed at the end as it swallows events once sent.',
    direction: 'outgoing',
    handler: outgoingHandler,
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

  const err = await client.sendOutgoingEvent(event)

  if (err) {
    next(err)
  }
  next(undefined, false)
}
