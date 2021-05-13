import * as sdk from 'botpress/sdk'
import { ChannelRenderer, ChannelSender } from 'common/channel'
import _ from 'lodash'
import { WebCommonRenderer } from '../renderers'
import { WebCommonSender } from '../senders'

import Database from './db'
import { WebContext } from './typings'

export const CHANNEL_NAME = 'web'

export default async (bp: typeof sdk, db: Database) => {
  const config: any = {} // FIXME
  const { botName = 'Bot', botAvatarUrl = undefined } = config || {} // FIXME
  const renderers: ChannelRenderer<WebContext>[] = [new WebCommonRenderer()]
  const senders: ChannelSender<WebContext>[] = [new WebCommonSender()]

  bp.events.registerMiddleware({
    description:
      'Sends out messages that targets platform = webchat.' +
      ' This middleware should be placed at the end as it swallows events once sent.',
    direction: 'outgoing',
    handler: outgoingHandler,
    name: 'web.sendMessages',
    order: 100
  })

  async function outgoingHandler(event: sdk.IO.OutgoingEvent, next: sdk.IO.MiddlewareNextCallback) {
    if (event.channel !== CHANNEL_NAME) {
      return next()
    }

    const context: WebContext = {
      bp,
      event,
      client: bp,
      handlers: [],
      payload: _.cloneDeep(event.payload),
      botUrl: process.EXTERNAL_URL,
      messages: [],
      conversationId: event.threadId || (await db.getOrCreateRecentConversation(event.botId, event.target)),
      db,
      botName,
      botAvatarUrl
    }

    for (const renderer of renderers) {
      if (renderer.handles(context)) {
        renderer.render(context)
        context.handlers.push(renderer.id)
      }
    }

    for (const sender of senders) {
      if (sender.handles(context)) {
        await sender.send(context)
      }
    }

    next(undefined, false)
  }
}
