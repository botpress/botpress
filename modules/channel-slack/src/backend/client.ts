import { createMessageAdapter } from '@slack/interactive-messages'
import { RTMClient } from '@slack/rtm-api'
import { WebClient } from '@slack/web-api'
import axios from 'axios'
import * as sdk from 'botpress/sdk'
import { Router } from 'express'
import _ from 'lodash'
import util from 'util'

import { Config } from '../config'

import { Clients } from './typings'

const debug = DEBUG('channel-slack')
const debugIncoming = debug.sub('incoming')
const debugOutgoing = debug.sub('outgoing')

const outgoingTypes = ['text', 'image', 'actions', 'typing', 'carousel']

export class SlackClient {
  private router: Router & sdk.http.RouterExtension
  private client: WebClient
  private rtm: RTMClient
  private interactive: any
  private botId: string

  constructor(private bp: typeof sdk, botId: string, config: Config, router) {
    this.botId = botId
    this.router = router

    this.client = new WebClient(config.botToken)
    this.rtm = new RTMClient(config.botToken)
    this.interactive = createMessageAdapter(config.signingSecret, {}) as any
  }

  async initialize() {
    await this._setupInteractiveListener()
    await this._setupRealtime()
  }

  private _setupInteractiveListener() {
    this.interactive.action({ type: 'button' }, async payload => {
      const actionId = _.get(payload, 'actions[0].action_id', '')
      const label = _.get(payload, 'actions[0].text.text', '')
      const value = _.get(payload, 'actions[0].value', '')

      // Either we leave buttons displayed, we replace with the selection, or we remove it
      // await axios.post(payload.response_url, { text: `*${label}*` }) // { delete_original: true }

      // Discarding actions ex open url
      if (!actionId.startsWith('discard_action')) {
        await this.sendEvent(payload, { type: 'quick_reply', text: label, payload: value })
      }
    })

    this.interactive.action({ actionId: 'option_selected' }, async payload => {
      const label = _.get(payload, 'actions[0].selected_option.text.text', '')
      const value = _.get(payload, 'actions[0].selected_option.value', '')

      //  await axios.post(payload.response_url, { text: `*${label}*` })
      await this.sendEvent(payload, { type: 'quick_reply', text: label, payload: value })
    })

    this.router.use(`/bots/${this.botId}/callback`, this.interactive.requestListener())
  }

  private async _setupRealtime() {
    const discardedSubtypes = ['bot_message', 'message_deleted', 'message_changed']
    this.rtm.on('message', async payload => {
      debugIncoming(payload)

      if (!discardedSubtypes.includes(payload.subtype)) {
        await this.sendEvent(payload, { type: 'text', text: payload.text })
      }
    })

    await this.rtm.start()
  }

  async handleOutgoingEvent(event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback) {
    if (event.type === 'typing') {
      return this.rtm.sendTyping(event.threadId || event.target)
    }

    const messageType = event.type === 'default' ? 'text' : event.type
    if (!_.includes(outgoingTypes, messageType)) {
      return next(new Error('Unsupported event type: ' + event.type))
    }

    const blocks = []
    if (messageType === 'image' || messageType === 'actions') {
      blocks.push(event.payload)
    } else if (messageType === 'carousel') {
      event.payload.cards.forEach(card => blocks.push(...card))
    }

    if (event.payload.quick_replies) {
      blocks.push({ type: 'section', text: { type: 'mrkdwn', text: event.payload.text } })
      blocks.push(event.payload.quick_replies)
    }

    const message = {
      text: event.payload.text,
      channel: event.threadId || event.target,
      blocks
    }

    debugOutgoing(util.inspect(message))
    await this.client.chat.postMessage(message)

    next(undefined, false)
  }

  private async sendEvent(ctx: any, payload: any) {
    const threadId = _.get(ctx, 'channel.id') || _.get(ctx, 'channel')
    const target = _.get(ctx, 'user.id') || _.get(ctx, 'user')

    this.bp.events.sendEvent(
      this.bp.IO.Event({
        botId: this.botId,
        channel: 'slack',
        direction: 'incoming',
        payload,
        type: payload.type,
        preview: payload.text,
        threadId: threadId && threadId.toString(),
        target: target && target.toString()
      })
    )
  }
}

export async function setupMiddleware(bp: typeof sdk, clients: Clients) {
  bp.events.registerMiddleware({
    description:
      'Sends out messages that targets platform = slack.' +
      ' This middleware should be placed at the end as it swallows events once sent.',
    direction: 'outgoing',
    handler: outgoingHandler,
    name: 'slack.sendMessages',
    order: 100
  })

  async function outgoingHandler(event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback) {
    if (event.channel !== 'slack') {
      return next()
    }

    const client: SlackClient = clients[event.botId]
    if (!client) {
      return next()
    }

    return client.handleOutgoingEvent(event, next)
  }
}
