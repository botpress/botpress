import { RuntimeError } from '@botpress/client'
import * as bpCommon from '@botpress/common'
import * as sdk from '@botpress/sdk'
import SunshineConversationsClient from 'sunshine-conversations-client'
import { getZendeskClient } from './client'
import { getMessagingClient } from './messaging-client'
import * as bp from '.botpress'

type IntegrationLogger = bp.Logger

class Tags<T extends Record<string, string>> {
  private constructor(
    private _t: { tags: T },
    private _logger: IntegrationLogger
  ) {}

  public static of<T extends Record<string, string>>(t: { tags: T }, logger: IntegrationLogger) {
    return new Tags(t, logger)
  }

  public find(key: keyof T): string | undefined {
    return this._t.tags[key]
  }

  public get(key: keyof T): string {
    const value = this.find(key)
    if (!value) {
      const msg = `Could not find tag ${key as string}`
      this._logger.forBot().error(msg)
      throw new sdk.RuntimeError(`Could not find tag ${key as string}`)
    }
    return value
  }
}

const wrapChannel = bpCommon.createChannelWrapper<bp.IntegrationProps>()({
  toolFactories: {
    ticketId: ({ conversation, logger }) => Tags.of(conversation, logger).get('id'),
    zendeskAuthorId: async ({ client, logger, payload, user }) => {
      const userId = 'userId' in payload && payload.userId ? payload.userId : user.id
      return Tags.of((await client.getUser({ id: userId })).user, logger).get('id')
    },
    zendeskClient: ({ ctx }) => getZendeskClient(ctx.configuration),
    messagingConversationId: ({ conversation, logger }) => Tags.of(conversation, logger).get('id'),
    messagingClient: ({ ctx }): ReturnType<typeof getMessagingClient> => {
      return getMessagingClient(ctx.configuration)
    },
    messagingAppId: ({ ctx }): string => {
      if (!ctx.configuration.messagingAppId) {
        throw new sdk.RuntimeError('Messaging App ID not configured')
      }
      return ctx.configuration.messagingAppId
    },
  },
})

// Types for Sunshine Conversations messaging
type SmoochBaseAction = {
  type: string
  text: string
}

type SmoochLinkAction = {
  type: 'link'
  uri: string
} & SmoochBaseAction

type SmoochPostbackAction = {
  type: 'postback'
  payload: string
} & SmoochBaseAction

type SmoochReplyAction = {
  type: 'reply'
  payload: string
} & SmoochBaseAction

type SmoochAction = SmoochLinkAction | SmoochPostbackAction | SmoochReplyAction

type SmoochCard = {
  title: string
  description?: string
  mediaUrl?: string
  actions: SmoochAction[]
}

const POSTBACK_PREFIX = 'postback::'
const SAY_PREFIX = 'say::'

type Choice = bp.channels.messaging.choice.Choice

function renderChoiceMessage(payload: Choice) {
  return {
    type: 'text',
    text: payload.text,
    actions: payload.options.map((r) => ({ type: 'reply', text: r.label, payload: r.value })),
  }
}

type Carousel = bp.channels.messaging.carousel.Carousel

type SendMessageProps = Pick<bp.AnyMessageProps, 'ctx' | 'conversation' | 'ack'>

async function sendMessagingMessage(
  props: SendMessageProps,
  payload: any,
  messagingClient: NonNullable<ReturnType<typeof getMessagingClient>>,
  appId: string
) {
  const conversationId = props.conversation.tags.id

  if (!conversationId) {
    throw new RuntimeError('Conversation does not have a messaging identifier')
  }

  if (!messagingClient) {
    throw new RuntimeError('Messaging client is not available')
  }

  const data = new SunshineConversationsClient.MessagePost()
  data.content = payload
  data.author = {
    type: 'business',
  }

  const { messages } = await messagingClient.messages.postMessage(appId, conversationId, data)

  const message = messages[0]

  if (!message) {
    throw new RuntimeError('Message not sent')
  }

  await props.ack({ tags: { id: message.id } })

  if (messages.length > 1) {
    console.warn('More than one message was sent')
  }
}

async function sendMessagingCarousel(
  props: SendMessageProps,
  payload: Carousel,
  messagingClient: NonNullable<ReturnType<typeof getMessagingClient>>,
  appId: string
) {
  const items: SmoochCard[] = []

  for (const card of payload.items) {
    const actions: SmoochAction[] = []
    for (const button of card.actions) {
      if (button.action === 'url') {
        actions.push({
          type: 'link',
          text: button.label,
          uri: button.value,
        })
      } else if (button.action === 'postback') {
        actions.push({
          type: 'postback',
          text: button.label,
          payload: `${POSTBACK_PREFIX}${button.value}`,
        })
      } else if (button.action === 'say') {
        actions.push({
          type: 'postback',
          text: button.label,
          payload: `${SAY_PREFIX}${button.label}`,
        })
      }
    }

    if (actions.length === 0) {
      actions.push({
        type: 'postback',
        text: card.title,
        payload: card.title,
      })
    }

    items.push({ title: card.title, description: card.subtitle, mediaUrl: card.imageUrl, actions })
  }

  await sendMessagingMessage(props, { type: 'carousel', items }, messagingClient, appId)
}

export default {
  messaging: {
    messages: {
      text: wrapChannel(
        { channelName: 'messaging', messageType: 'text' },
        async ({ ack, payload, conversation, ctx, messagingClient, messagingAppId }) => {
          await sendMessagingMessage(
            { conversation, ctx, ack },
            { type: 'text', text: payload.text },
            messagingClient,
            messagingAppId
          )
        }
      ),
      image: wrapChannel(
        { channelName: 'messaging', messageType: 'image' },
        async ({ ack, payload, conversation, ctx, messagingClient, messagingAppId }) => {
          await sendMessagingMessage(
            { conversation, ctx, ack },
            { type: 'image', mediaUrl: payload.imageUrl },
            messagingClient,
            messagingAppId
          )
        }
      ),
      markdown: wrapChannel(
        { channelName: 'messaging', messageType: 'markdown' },
        async ({ ack, payload, conversation, ctx, messagingClient, messagingAppId }) => {
          await sendMessagingMessage(
            { conversation, ctx, ack },
            { type: 'text', text: payload.markdown },
            messagingClient,
            messagingAppId
          )
        }
      ),
      audio: wrapChannel(
        { channelName: 'messaging', messageType: 'audio' },
        async ({ ack, payload, conversation, ctx, messagingClient, messagingAppId }) => {
          await sendMessagingMessage(
            { conversation, ctx, ack },
            { type: 'file', mediaUrl: payload.audioUrl },
            messagingClient,
            messagingAppId
          )
        }
      ),
      video: wrapChannel(
        { channelName: 'messaging', messageType: 'video' },
        async ({ ack, payload, conversation, ctx, messagingClient, messagingAppId }) => {
          await sendMessagingMessage(
            { conversation, ctx, ack },
            { type: 'file', mediaUrl: payload.videoUrl },
            messagingClient,
            messagingAppId
          )
        }
      ),
      file: wrapChannel(
        { channelName: 'messaging', messageType: 'file' },
        async ({ ack, payload, conversation, ctx, messagingClient, messagingAppId }) => {
          try {
            await sendMessagingMessage(
              { conversation, ctx, ack },
              { type: 'file', mediaUrl: payload.fileUrl },
              messagingClient!,
              messagingAppId!
            )
          } catch (e) {
            const err = e as any
            // 400 errors can be sent if file has unsupported type
            // See: https://docs.smooch.io/guide/validating-files/#rejections
            if (err.status === 400 && err.response?.text) {
              console.info(err.response.text)
            }
            throw e
          }
        }
      ),
      location: wrapChannel(
        { channelName: 'messaging', messageType: 'location' },
        async ({ ack, payload, conversation, ctx, messagingClient, messagingAppId }) => {
          await sendMessagingMessage(
            { conversation, ctx, ack },
            {
              type: 'location',
              coordinates: {
                lat: payload.latitude,
                long: payload.longitude,
              },
            },
            messagingClient,
            messagingAppId
          )
        }
      ),
      carousel: wrapChannel(
        { channelName: 'messaging', messageType: 'carousel' },
        async ({ ack, payload, conversation, ctx, messagingClient, messagingAppId }) => {
          await sendMessagingCarousel({ conversation, ctx, ack }, payload, messagingClient!, messagingAppId!)
        }
      ),
      card: wrapChannel(
        { channelName: 'messaging', messageType: 'card' },
        async ({ ack, payload, conversation, ctx, messagingClient, messagingAppId }) => {
          await sendMessagingCarousel({ conversation, ctx, ack }, { items: [payload] }, messagingClient, messagingAppId)
        }
      ),
      dropdown: wrapChannel(
        { channelName: 'messaging', messageType: 'dropdown' },
        async ({ ack, payload, conversation, ctx, messagingClient, messagingAppId }) => {
          await sendMessagingMessage(
            { conversation, ctx, ack },
            renderChoiceMessage(payload),
            messagingClient,
            messagingAppId
          )
        }
      ),
      choice: wrapChannel(
        { channelName: 'messaging', messageType: 'choice' },
        async ({ ack, payload, conversation, ctx, messagingClient, messagingAppId }) => {
          await sendMessagingMessage(
            { conversation, ctx, ack },
            renderChoiceMessage(payload),
            messagingClient,
            messagingAppId
          )
        }
      ),
      bloc: wrapChannel({ channelName: 'messaging', messageType: 'bloc' }, async () => {
        throw new RuntimeError('Not implemented')
      }),
    },
  },
  hitl: {
    messages: {
      text: wrapChannel(
        { channelName: 'hitl', messageType: 'text' },
        async ({ ack, payload, ticketId, zendeskAuthorId, zendeskClient }) => {
          const { zendeskCommentId } = await zendeskClient.createPlaintextComment(
            ticketId,
            zendeskAuthorId,
            payload.text
          )
          await ack({ tags: { zendeskCommentId: String(zendeskCommentId) } })
        }
      ),

      image: wrapChannel(
        { channelName: 'hitl', messageType: 'image' },
        async ({ ack, payload, ticketId, zendeskAuthorId, zendeskClient }) => {
          const { zendeskCommentId } = await zendeskClient.createPlaintextComment(
            ticketId,
            zendeskAuthorId,
            payload.imageUrl
          )
          await ack({ tags: { zendeskCommentId: String(zendeskCommentId) } })
        }
      ),

      audio: wrapChannel(
        { channelName: 'hitl', messageType: 'audio' },
        async ({ ack, payload, ticketId, zendeskAuthorId, zendeskClient }) => {
          const { zendeskCommentId } = await zendeskClient.createPlaintextComment(
            ticketId,
            zendeskAuthorId,
            payload.audioUrl
          )
          await ack({ tags: { zendeskCommentId: String(zendeskCommentId) } })
        }
      ),

      video: wrapChannel(
        { channelName: 'hitl', messageType: 'video' },
        async ({ ack, payload, ticketId, zendeskAuthorId, zendeskClient }) => {
          const { zendeskCommentId } = await zendeskClient.createPlaintextComment(
            ticketId,
            zendeskAuthorId,
            payload.videoUrl
          )
          await ack({ tags: { zendeskCommentId: String(zendeskCommentId) } })
        }
      ),

      file: wrapChannel(
        { channelName: 'hitl', messageType: 'file' },
        async ({ ack, payload, ticketId, zendeskAuthorId, zendeskClient }) => {
          const { zendeskCommentId } = await zendeskClient.createPlaintextComment(
            ticketId,
            zendeskAuthorId,
            payload.fileUrl
          )
          await ack({ tags: { zendeskCommentId: String(zendeskCommentId) } })
        }
      ),

      bloc: wrapChannel(
        { channelName: 'hitl', messageType: 'bloc' },
        async ({ ack, payload, ticketId, zendeskAuthorId, zendeskClient }) => {
          for (const item of payload.items) {
            switch (item.type) {
              case 'text':
                await zendeskClient.createPlaintextComment(ticketId, zendeskAuthorId, item.payload.text)
                break
              case 'markdown':
                await zendeskClient.createPlaintextComment(ticketId, zendeskAuthorId, item.payload.markdown)
                break
              case 'image':
                await zendeskClient.createPlaintextComment(ticketId, zendeskAuthorId, item.payload.imageUrl)
                break
              case 'video':
                await zendeskClient.createPlaintextComment(ticketId, zendeskAuthorId, item.payload.videoUrl)
                break
              case 'audio':
                await zendeskClient.createPlaintextComment(ticketId, zendeskAuthorId, item.payload.audioUrl)
                break
              case 'file':
                await zendeskClient.createPlaintextComment(ticketId, zendeskAuthorId, item.payload.fileUrl)
                break
              case 'location':
                const { title, address, latitude, longitude } = item.payload
                const messageParts = []

                if (title) {
                  messageParts.push(title, '')
                }
                if (address) {
                  messageParts.push(address, '')
                }
                messageParts.push(`Latitude: ${latitude}`, `Longitude: ${longitude}`)

                await zendeskClient.createPlaintextComment(ticketId, zendeskAuthorId, messageParts.join('\n'))
                break
              default:
                item satisfies never
            }
          }

          await ack({ tags: {} })
        }
      ),
    },
  },
} satisfies bp.IntegrationProps['channels']
