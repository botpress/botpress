import {
  BotFrameworkAdapter,
  TurnContext,
  ConversationReference,
  HeroCard,
  Activity,
  CardFactory,
  CardImage
} from 'botbuilder'
import * as sdk from 'botpress/sdk'
import { Router } from 'express'
import _ from 'lodash'

import url from 'url'

import { Config } from '../config'

import { Clients } from './typings'

const outgoingTypes = ['message', 'typing', 'image', 'login_prompt', 'carousel']

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

    let msg: Partial<Activity> = event.payload
    if (msg.type === 'carousel') {
      msg = this._sendCarousel(event)
    }

    await this.adapter.continueConversation(ref, async turnContext => {
      await turnContext.sendActivity(msg)
    })
  }

  private _sendCarousel(event: sdk.IO.Event) {
    return {
      type: 'message',
      attachments: event.payload.items.map(card => {
        let contentUrl = url.resolve(event.payload.BOT_URL, card.image)

        // RETIRER
        if (true) {
          const base = 'https://141d2bcf.ngrok.io/'
          contentUrl = contentUrl.replace('http://localhost:3000/', base)
        }
        return CardFactory.heroCard(card.title, CardFactory.images([contentUrl]), CardFactory.actions([]))
      })
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
