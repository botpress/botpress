import * as sdk from 'botpress/sdk'

import { Clients } from './typings'

export const registerMiddleware = (bp: typeof sdk, outgoingHandler) => {
  bp.events.registerMiddleware({
    description:
      'Sends out messages that targets platform = Smooch.' +
      ' This middleware should be placed at the end as it swallows events once sent.',
    direction: 'outgoing',
    handler: outgoingHandler,
    name: 'smooch.sendMessages',
    order: 100
  })
}

export async function incomingHandler(bp: typeof sdk, botId: string, body) {
  if (!body.messages) {
    return
  }

  for (const message of body.messages) {
    if (message.type !== 'text') {
      continue
    }

    await bp.events.sendEvent(
      bp.IO.Event({
        botId,
        channel: 'smooch',
        direction: 'incoming',
        type: 'text',
        payload: {
          type: 'text',
          markdown: false,
          text: message.text
        },
        preview: message.text,
        target: body.appUser._id
      })
    )
  }
}

export async function setupMiddleware(bp: typeof sdk, clients: Clients) {
  registerMiddleware(bp, outgoingHandler)

  async function outgoingHandler(event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback) {
    if (event.channel != 'smooch') {
      return next()
    }

    const client = clients[event.botId]
    if (!client) {
      return next()
    }

    if (event.type === 'typing') {
      await client.appUsers.conversationActivity({
        appId: client.keyId,
        userId: event.target,
        activityProps: {
          role: 'appMaker',
          type: 'typing:start'
        }
      })
    } else if (event.type === 'text') {
      await client.appUsers.sendMessage({
        appId: client.keyId,
        userId: event.target,
        message: {
          text: event.payload.text,
          role: 'appMaker',
          type: 'text'
        }
      })
    }

    next(undefined, false)
  }
}
