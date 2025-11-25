import { RuntimeError } from '@botpress/client'
import { getMessagingClient } from '../messaging-client'
import type { Carousel, Choice, SendMessageProps, SmoochAction, SmoochCard } from '../types/messaging'
import { wrapChannel } from './shared'
const SunshineConversationsClient = require('sunshine-conversations-client')

export const messaging = {
  messages: {
    text: createMessageHandler('text', (payload) => ({ type: 'text', text: payload.text })),
    image: createMessageHandler('image', (payload) => ({ type: 'image', mediaUrl: payload.imageUrl })),
    markdown: createMessageHandler('markdown', (payload) => ({ type: 'text', text: payload.markdown })),
    audio: createMessageHandler('audio', (payload) => ({ type: 'file', mediaUrl: payload.audioUrl })),
    video: createMessageHandler('video', (payload) => ({ type: 'file', mediaUrl: payload.videoUrl })),
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
    location: createMessageHandler('location', (payload) => ({
      type: 'location',
      coordinates: {
        lat: payload.latitude,
        long: payload.longitude,
      },
    })),
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
    dropdown: createMessageHandler('dropdown', (payload) => renderChoiceMessage(payload)),
    choice: createMessageHandler('choice', (payload) => renderChoiceMessage(payload)),
    bloc: wrapChannel({ channelName: 'messaging', messageType: 'bloc' }, async () => {
      throw new RuntimeError('Not implemented')
    }),
  },
}

const POSTBACK_PREFIX = 'postback::'
const SAY_PREFIX = 'say::'

function renderChoiceMessage(payload: Choice) {
  return {
    type: 'text',
    text: payload.text,
    actions: payload.options.map((r: { label: string; value: string }) => ({
      type: 'reply',
      text: r.label,
      payload: r.value,
    })),
  }
}

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

function createMessageHandler(messageType: string, payloadMapper: (payload: any) => any) {
  return wrapChannel({ channelName: 'messaging', messageType: messageType as any }, async (props: any) => {
    const { ack, payload, conversation, ctx, messagingClient, messagingAppId } = props
    await sendMessagingMessage({ conversation, ctx, ack }, payloadMapper(payload), messagingClient, messagingAppId)
  })
}
