import { RuntimeError } from '@botpress/client'
import { Action, CarouselItem, MessageContent, PostMessageRequest, createClient } from './sunshine-api'
import { Carousel, Choice } from './types'
import { getConversationId } from './util'
import * as bp from '.botpress'

export const channels = {
  channel: {
    messages: {
      text: async (props) => {
        await sendMessage(props, { type: 'text', text: props.payload.text })
      },
      image: async (props) => {
        await sendMessage(props, { type: 'image', mediaUrl: props.payload.imageUrl })
      },
      markdown: async (props) => {
        await sendMessage(props, { type: 'text', text: props.payload.markdown })
      },
      audio: async (props) => {
        await sendMessage(props, { type: 'file', mediaUrl: props.payload.audioUrl })
      },
      video: async (props) => {
        await sendMessage(props, { type: 'file', mediaUrl: props.payload.videoUrl })
      },
      file: async (props) => {
        try {
          await sendMessage(props, { type: 'file', mediaUrl: props.payload.fileUrl })
        } catch (e) {
          const err = e as any
          // 400 errors can be sent if file has unsupported type
          // See: https://docs.smooch.io/guide/validating-files/#rejections
          if (err.status === 400 && err.response?.text) {
            console.info(err.response.text)
          }
          throw e
        }
      },
      location: async (props) => {
        await sendMessage(props, {
          type: 'location',
          coordinates: {
            lat: props.payload.latitude,
            long: props.payload.longitude,
          },
        })
      },
      carousel: async (props) => {
        await sendCarousel(props, props.payload)
      },
      card: async (props) => {
        await sendCarousel(props, { items: [props.payload] })
      },
      dropdown: async (props) => {
        await sendMessage(props, renderChoiceMessage(props.payload))
      },
      choice: async (props) => {
        await sendMessage(props, renderChoiceMessage(props.payload))
      },
      bloc: () => {
        throw new RuntimeError('Not implemented')
      },
    },
  },
} satisfies bp.IntegrationProps['channels']

const POSTBACK_PREFIX = 'postback::'
const SAY_PREFIX = 'say::'

function renderChoiceMessage(payload: Choice): MessageContent {
  return {
    type: 'text',
    text: payload.text,
    actions: payload.options.map((r) => ({ type: 'reply' as const, text: r.label, payload: r.value })),
  }
}

type SendMessageProps = Pick<bp.AnyMessageProps, 'ctx' | 'conversation' | 'ack'>

async function sendMessage({ conversation, ctx, ack }: SendMessageProps, payload: MessageContent) {
  const client = createClient(ctx.configuration.keyId, ctx.configuration.keySecret)

  const data: PostMessageRequest = {
    author: { type: 'business' },
    content: payload,
  }

  const { messages } = await client.messages.postMessage(ctx.configuration.appId, getConversationId(conversation), data)

  const message = messages?.[0]

  if (!message) {
    throw new Error('Message not sent')
  }

  await ack({ tags: { id: message.id } })

  if (messages.length > 1) {
    console.warn('More than one message was sent')
  }
}

const sendCarousel = async (props: SendMessageProps, payload: Carousel) => {
  const items: CarouselItem[] = []

  for (const card of payload.items) {
    const actions: Action[] = []
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

  await sendMessage(props, {
    type: 'carousel',
    items,
  })
}
