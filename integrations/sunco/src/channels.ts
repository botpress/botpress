import { RuntimeError } from '@botpress/client'
import { Action, CarouselItem, MessageContent, PostMessageRequest } from './api/sunshine-api'
import { getSuncoClient } from './client'
import { getStoredCredentials } from './get-stored-credentials'
import { Carousel, Choice, Conversation, StoredCredentials } from './types'
import { getSuncoConversationId } from './util'
import * as bp from '.botpress'

export const channels = {
  channel: {
    messages: {
      text: async (props) => {
        const credentials = await getStoredCredentials(props.client, props.ctx)
        await sendMessage(props, { type: 'text', text: props.payload.text }, credentials)
      },
      image: async (props) => {
        const credentials = await getStoredCredentials(props.client, props.ctx)
        const mediaUrl = await getMediaUrl(props.payload.imageUrl, props.conversation, credentials)
        await sendMessage(props, { type: 'image', mediaUrl }, credentials)
      },
      markdown: async (props) => {
        const credentials = await getStoredCredentials(props.client, props.ctx)
        await sendMessage(props, { type: 'text', text: props.payload.markdown }, credentials)
      },
      audio: async (props) => {
        const credentials = await getStoredCredentials(props.client, props.ctx)
        const mediaUrl = await getMediaUrl(props.payload.audioUrl, props.conversation, credentials)
        await sendMessage(props, { type: 'file', mediaUrl }, credentials)
      },
      video: async (props) => {
        const credentials = await getStoredCredentials(props.client, props.ctx)
        const mediaUrl = await getMediaUrl(props.payload.videoUrl, props.conversation, credentials)
        await sendMessage(props, { type: 'file', mediaUrl }, credentials)
      },
      file: async (props) => {
        try {
          const credentials = await getStoredCredentials(props.client, props.ctx)
          const mediaUrl = await getMediaUrl(props.payload.fileUrl, props.conversation, credentials)
          await sendMessage(props, { type: 'file', mediaUrl }, credentials)
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
        const credentials = await getStoredCredentials(props.client, props.ctx)
        await sendMessage(
          props,
          {
            type: 'location',
            coordinates: {
              lat: props.payload.latitude,
              long: props.payload.longitude,
            },
          },
          credentials
        )
      },
      carousel: async (props) => {
        const credentials = await getStoredCredentials(props.client, props.ctx)
        await sendCarousel(props, props.payload, credentials)
      },
      card: async (props) => {
        const credentials = await getStoredCredentials(props.client, props.ctx)
        await sendCarousel(props, { items: [props.payload] }, credentials)
      },
      dropdown: async (props) => {
        const credentials = await getStoredCredentials(props.client, props.ctx)
        await sendMessage(props, renderChoiceMessage(props.payload), credentials)
      },
      choice: async (props) => {
        const credentials = await getStoredCredentials(props.client, props.ctx)
        await sendMessage(props, renderChoiceMessage(props.payload), credentials)
      },
      bloc: () => {
        throw new RuntimeError('Not implemented')
      },
    },
  },
} satisfies bp.IntegrationProps['channels']

const POSTBACK_PREFIX = 'postback::'
const SAY_PREFIX = 'say::'

/**
 * Gets the media URL for sending in messages.
 * If the source URL is from Zendesk, uploads it to Zendesk's Attachments API.
 * Otherwise, returns the original URL as-is.
 * The reason for this is that Zendesk will fail the sendMessage request if the URL is from
 * another Sunco Conversation.
 */
async function getMediaUrl(
  sourceUrl: string,
  conversation: Conversation,
  credentials: StoredCredentials
): Promise<string> {
  try {
    const hostname = new URL(sourceUrl).hostname
    if (hostname.endsWith('zendesk.com')) {
      return getSuncoClient(credentials).downloadAndUploadAttachment(sourceUrl, getSuncoConversationId(conversation))
    }
  } catch {
    // Invalid URL or error, return as-is
  }
  return sourceUrl
}

function renderChoiceMessage(payload: Choice): MessageContent {
  return {
    type: 'text',
    text: payload.text,
    actions: payload.options.map((r) => ({ type: 'reply' as const, text: r.label, payload: r.value })),
  }
}

type SendMessageProps = Pick<bp.AnyMessageProps, 'ctx' | 'conversation' | 'ack'>

async function sendMessage(
  { conversation, ack }: SendMessageProps,
  payload: MessageContent,
  credentials: StoredCredentials
) {
  const data: PostMessageRequest = {
    author: { type: 'business' },
    content: payload,
  }

  const { messages } = await getSuncoClient(credentials).postMessage(getSuncoConversationId(conversation), data)

  const message = messages?.[0]

  if (!message) {
    throw new Error('Message not sent')
  }

  await ack({ tags: { id: message.id } })

  if (messages.length > 1) {
    console.warn('More than one message was sent')
  }
}

const sendCarousel = async (props: SendMessageProps, payload: Carousel, credentials: StoredCredentials) => {
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

  await sendMessage(
    props,
    {
      type: 'carousel',
      items,
    },
    credentials
  )
}
