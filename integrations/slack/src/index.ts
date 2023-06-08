import type { Conversation } from '@botpress/client'
import type { AckFunction } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { ChatPostMessageArguments, WebClient } from '@slack/web-api'
import { isInteractiveRequest, parseInteractiveBody, respondInteractive } from './utils'
import { Integration, channels, secrets } from '.botpress'

sentryHelpers.init({
  dsn: secrets.SENTRY_DSN,
  environment: secrets.SENTRY_ENVIRONMENT,
  release: secrets.SENTRY_RELEASE,
})

const log = console

const integration = new Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    addReaction: async ({ input, ctx }) => {
      const client = new WebClient(ctx.configuration.botToken)

      await client.reactions.add({
        name: input.name,
        channel: input.channel,
        timestamp: input.timestamp,
      })

      return {}
    },
  },
  channels: {
    channel: {
      messages: {
        text: async ({ payload, ctx, conversation, ack }) => {
          await sendSlackMessage(ctx.configuration.botToken, ack, {
            channel: getChannel(conversation),
            text: payload.text,
          })
        },
        image: async ({ payload, ctx, conversation, ack }) => {
          await sendSlackMessage(ctx.configuration.botToken, ack, {
            channel: getChannel(conversation),
            blocks: [
              {
                type: 'image',
                image_url: payload.imageUrl,
                alt_text: 'image',
              },
            ],
          })
        },
        markdown: async ({ ctx, conversation, ack, payload }) => {
          await sendSlackMessage(ctx.configuration.botToken, ack, {
            channel: getChannel(conversation),
            text: payload.markdown,
            blocks: [
              {
                type: 'section',
                text: { type: 'mrkdwn', text: payload.markdown },
              },
            ],
          })
        },
        audio: async ({ ctx, conversation, ack, payload }) => {
          await sendSlackMessage(ctx.configuration.botToken, ack, {
            channel: getChannel(conversation),
            text: 'audio',
            blocks: [
              {
                type: 'section',
                text: { type: 'mrkdwn', text: `<${payload.audioUrl}|audio>` },
              },
            ],
          })
        },
        video: async ({ ctx, conversation, ack, payload }) => {
          await sendSlackMessage(ctx.configuration.botToken, ack, {
            channel: getChannel(conversation),
            text: 'video',
            blocks: [
              {
                type: 'section',
                text: { type: 'mrkdwn', text: `<${payload.videoUrl}|video>` },
              },
            ],
          })
        },
        file: async ({ ctx, conversation, ack, payload }) => {
          await sendSlackMessage(ctx.configuration.botToken, ack, {
            channel: getChannel(conversation),
            text: 'file',
            blocks: [
              {
                type: 'section',
                text: { type: 'mrkdwn', text: `<${payload.fileUrl}|file>` },
              },
            ],
          })
        },
        location: async ({ ctx, conversation, ack, payload }) => {
          const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${payload.latitude},${payload.longitude}`
          await sendSlackMessage(ctx.configuration.botToken, ack, {
            channel: getChannel(conversation),
            text: 'location',
            blocks: [
              {
                type: 'section',
                text: { type: 'mrkdwn', text: `<${googleMapsLink}|location>` },
              },
            ],
          })
        },
        carousel: async ({ ctx, conversation, ack, payload }) => {
          await sendSlackMessage(ctx.configuration.botToken, ack, {
            channel: getChannel(conversation),
            text: 'carousel',
            blocks: payload.items.flatMap(renderCard).filter(notEmpty),
          })
        },
        card: async ({ ctx, conversation, ack, payload }) => {
          await sendSlackMessage(ctx.configuration.botToken, ack, {
            channel: getChannel(conversation),
            text: 'card',
            blocks: renderCard(payload),
          })
        },
        dropdown: async ({ ctx, conversation, ack, payload }) => {
          await sendSlackMessage(ctx.configuration.botToken, ack, {
            channel: getChannel(conversation),
            text: payload.text,
            blocks:
              payload.options?.length > 0
                ? [
                    {
                      type: 'actions',
                      elements: [
                        {
                          type: 'static_select',
                          action_id: 'option_selected',
                          placeholder: {
                            type: 'plain_text',
                            text: payload.text,
                          },
                          options: payload.options
                            .filter((o) => o.label.length > 0)
                            .map((choice) => ({
                              text: {
                                type: 'plain_text',
                                text: choice.label,
                              },
                              value: choice.value,
                            })),
                        },
                      ],
                    },
                  ]
                : undefined,
          })
        },
        choice: async ({ ctx, conversation, ack, payload }) => {
          await sendSlackMessage(ctx.configuration.botToken, ack, {
            channel: getChannel(conversation),
            text: payload.text,
            blocks:
              payload.options?.length > 0
                ? [
                    {
                      type: 'section',
                      text: {
                        type: 'plain_text',
                        text: payload.text,
                      },
                    },
                    {
                      type: 'actions',
                      elements: payload.options
                        .filter((o) => o.label.length > 0)
                        .map((choice, i) => ({
                          type: 'button',
                          text: { type: 'plain_text', text: choice.label },
                          value: choice.value,
                          action_id: `quick_reply_${i}`,
                        })),
                    },
                  ]
                : undefined,
          })
        },
      },
    },
  },
  handler: async (props) => {
    const { req, client } = props

    if (props.req.path.startsWith('/oauth')) {
      return onOAuth()
    }

    if (!req.body) {
      log.warn('Handler received an empty body')
      return
    }

    if (isInteractiveRequest(req)) {
      const body = parseInteractiveBody(req)
      const actionValue = await respondInteractive(body)

      if (body.type !== 'block_actions') {
        throw Error(`Interaction type ${body.type} is not supported yet`)
      }

      const { conversation } = await client.getOrCreateConversation({
        channel: 'channel',
        tags: {
          'slack:id': body.channel.id,
        },
      })

      const { user } = await client.getOrCreateUser({
        tags: {
          'slack:id': body.user.id,
        },
      })

      await client.createMessage({
        tags: { 'slack:ts': body.message.ts },
        type: 'text',
        userId: user.id,
        conversationId: conversation.id,
        payload: { text: actionValue },
      })

      return
    }

    const data = JSON.parse(req.body)

    if (data.type === 'url_verification') {
      log.info('Handler received request of type url_verification')
      return {
        body: JSON.stringify({ challenge: data.challenge }),
      }
    }

    log.info(`Handler received request of type ${data.event.type}`)

    if (data.event.bot_id) {
      return
    }

    switch (data.event.type) {
      case 'message':
        const { conversation } = await client.getOrCreateConversation({
          channel: 'channel',
          tags: {
            'slack:id': data.event.channel,
          },
        })

        const { user } = await client.getOrCreateUser({
          tags: {
            'slack:id': data.event.user,
          },
        })

        await client.createMessage({
          tags: { 'slack:ts': data.event.ts },
          type: 'text',
          userId: user.id,
          conversationId: conversation.id,
          payload: { text: data.event.text },
        })
        break
      default:
        return
    }

    return
  },
  createUser: async ({ client, tags, ctx }) => {
    const userId = tags['slack:id']

    if (!userId) {
      return
    }

    const slack = new WebClient(ctx.configuration.botToken)
    const member = await slack.users.info({ user: userId })

    if (!member.user?.id) {
      return
    }

    const { user } = await client.getOrCreateUser({ tags: { 'slack:id': `${member.user?.id}` } })

    return {
      body: JSON.stringify({ user: { id: user.id } }),
      headers: {},
      statusCode: 200,
    }
  },
  createConversation: async ({ client, channel, tags, ctx }) => {
    const conversationId = tags['slack:id']

    if (!conversationId) {
      return
    }

    const slack = new WebClient(ctx.configuration.botToken)
    const response = await slack.conversations.info({ channel: conversationId })

    if (!response.channel?.id) {
      return
    }

    const { conversation } = await client.getOrCreateConversation({
      channel,
      tags: { 'slack:id': `${response.channel.id}` },
    })

    return {
      body: JSON.stringify({ conversation: { id: conversation.id } }),
      headers: {},
      statusCode: 200,
    }
  },
})

export default sentryHelpers.wrapIntegration(integration)

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined
}

type SlackMessage = NonNullable<Awaited<ReturnType<WebClient['chat']['postMessage']>>['message']>

function getTags(message: SlackMessage) {
  const tags: Record<string, string> = {}

  if (!message.ts) {
    throw Error('No message timestamp found')
  }

  tags['slack:ts'] = message.ts

  return tags
}

// type handlerProps = Parameters<ConstructorParameters<typeof Integration>['0']['handler']>['0']

export function onOAuth() {
  return {}
}

export function getChannel(conversation: Conversation): string {
  const channel = conversation.tags['slack:id']

  if (!channel) {
    throw Error(`No channel found for conversation ${conversation.id}`)
  }

  return channel
}

export async function sendSlackMessage(botToken: string, ack: AckFunction, payload: ChatPostMessageArguments) {
  const client = new WebClient(botToken)
  const response = await client.chat.postMessage(payload)
  const message = response.message

  if (!(response.ok && message)) {
    throw Error('Error sending message')
  }

  await ack({ tags: getTags(message) })

  return message
}

type Card = channels.Channels['channel']['card']
type CardAction = channels.Channels['channel']['card']['actions'][number]

export function renderCard(payload: Card): ChatPostMessageArguments['blocks'] {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${payload.title}*\n${payload.subtitle}`,
      },
      accessory: payload.imageUrl
        ? {
            type: 'image',
            image_url: payload.imageUrl,
            alt_text: 'image',
          }
        : undefined,
    },
    {
      type: 'actions',
      elements: payload.actions.map((item) => {
        switch (item.action) {
          case 'say':
            return renderButtonSay(item)
          case 'postback':
            return renderButtonPostback(item)
          case 'url':
            return renderButtonUrl(item)
          default:
            throw Error(`Unknown action type ${item.action}`)
        }
      }),
    },
  ]
}

function renderButtonUrl(action: CardAction) {
  return {
    type: 'button',
    text: {
      type: 'plain_text',
      text: action.label,
    },
    url: action.value,
  }
}

function renderButtonPostback(action: CardAction) {
  return {
    type: 'button',
    action_id: 'postback',
    text: {
      type: 'plain_text',
      text: action.label,
    },
    value: action.value,
  }
}

function renderButtonSay(action: CardAction) {
  return {
    type: 'button',
    action_id: 'say',
    text: {
      type: 'plain_text',
      text: action.label,
    },
    value: action.value,
  }
}
