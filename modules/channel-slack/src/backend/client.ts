import {Context} from '@slack/bolt/dist/types/middleware'
// @ts-ignore
import * as sdk from 'botpress/sdk'
// @ts-ignore
import _ from 'lodash'

import {Config} from '../config'

import {Clients} from './typings'
import app, {SlackApp} from "./app";

// @ts-ignore
const debug = DEBUG('channel-slack')
const debugIncoming = debug.sub('incoming')
const debugOutgoing = debug.sub('outgoing')

const outgoingTypes = ['text', 'image', 'actions', 'typing', 'carousel']


export class SlackClient {
    private readonly logger: sdk.Logger
    private app: SlackApp;

    constructor(private bp: typeof sdk,
                private botId: string,
                private config: Config,
                private router,
                private installationRepository
    ) {
        this.logger = bp.logger.forBot(botId)
    }

    async initialize() {
        this.app = app(
            this.botId,
            await this.router.getPublicPath(),
            this.logger,
            this.installationRepository,
            this.config
        )
        this.listenToMessages()
        this.listenToActions()
        this.router.use(this.app.getReceiver().app)
    }

    private listenToMessages() {
        this.app.getApp().message(async ({message, context, body}) => {
            const discardedSubtypes = ['bot_message', 'message_deleted', 'message_changed']
            if (!discardedSubtypes.includes(message.subtype)) {
                debugIncoming(`Received real time message %o`, message)

                await this.sendEvent({
                    body,
                    context,
                    payload: message,
                    teamId: body.team_id,
                    channelId: message.channel,
                    preview: message.text,
                    type: message.type,
                    userId: message.user,
                })
            }
        })
    }

    private listenToActions() {
        this.app.getApp().action({type: 'block_actions'}, async ({ack, action, respond, context, body}) => {
            await ack()

            if (action.type === 'button') {
                debugIncoming(`Received block action %o`, action)

                const actionId = action.action_id
                const label = action.text.text

                if (!actionId.startsWith('discard_action')) { // Some actions (ex: open url) should be discarded
                    // Either we leave buttons displayed, we replace with the selection, or we remove it
                    if (actionId.startsWith('replace_buttons')) {
                        await respond(`*${label}*`)
                    } else if (actionId.startsWith('remove_buttons')) {
                        // @ts-ignore
                        await respond({delete_original: true})
                    }

                    await this.sendEvent({
                        body,
                        context,
                        payload: action.value,
                        teamId: body.team.id,
                        channelId: body.channel.id,
                        preview: label,
                        type: 'quick_reply',
                        userId: body.user.id,
                    })
                }
            }

            if (action.action_id === 'feedback-overflow' && action.type === 'overflow') {
                debugIncoming(`Received feedback %o`, action)
                const blockId = action.block_id
                const selectedOption = action.selected_option.value

                const incomingEventId = blockId.replace('feedback-', '')
                const feedback = parseInt(selectedOption)

                const events = await this.bp.events.findEvents({incomingEventId, direction: 'incoming'})
                const event = events[0]
                await this.bp.events.updateEvent(event.id, {feedback})
            }
        })
    }

    private async sendEvent(
        {context, body, payload, type, preview, userId, channelId}: {
            context: Context; body: any, payload: any, type: string,
            preview: string, teamId: string, userId: string, channelId: string
        }) {

        await this.bp.events.sendEvent(
            this.bp.IO.Event({
                botId: this.botId,
                channel: 'slack',
                direction: 'incoming',
                payload: {
                    payload,
                    body,
                    context: {
                        ...context,
                        client: this.app.getApp().client
                    }
                },
                type: type,
                preview: preview,
                threadId: `${context.botToken} ${channelId}`,
                target: userId
            })
        )
    }

    async handleOutgoingEvent(event: sdk.IO.OutgoingEvent, next: sdk.IO.MiddlewareNextCallback) {
        if (event.type === 'typing') {
            return next(undefined, false)
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
            blocks.push({type: 'section', text: {type: 'mrkdwn', text: event.payload.text}})
            blocks.push(event.payload.quick_replies)
        }

        const [botToken, channel] = event.threadId.split(' ')
        const message = {
            text: event.payload.text,
            channel: channel,
            blocks
        }

        if (event.payload.collectFeedback && messageType === 'text') {
            message.blocks = [
                {
                    type: 'section',
                    block_id: `feedback-${event.incomingEventId}`,
                    text: {type: 'mrkdwn', text: event.payload.text},
                    accessory: {
                        type: 'overflow',
                        options: [
                            {
                                text: {
                                    type: 'plain_text',
                                    text: '👍'
                                },
                                value: '1'
                            },
                            {
                                text: {
                                    type: 'plain_text',
                                    text: '👎'
                                },
                                value: '-1'
                            }
                        ],
                        action_id: 'feedback-overflow'
                    }
                }
            ]
        }

        debugOutgoing(`Sending message %o`, message)

        await this.app.getApp().client.chat.postMessage({
            ...message,
            token: botToken
        })

        next(undefined, false)
    }

    async shutdown() {
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
