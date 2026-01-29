import { RuntimeError } from '@botpress/client'
import axios from 'axios'
import { Action, CarouselItem, MessageContent, PostMessageRequest, createClient } from './api/sunshine-api'
import { Carousel, Choice, Conversation } from './types'
import { getSuncoConversationId } from './util'
import * as bp from '.botpress'

export const channels = {
  channel: {
    messages: {
      text: async (props) => {
        await sendMessage(props, { type: 'text', text: props.payload.text })
      },
      image: async (props) => {
        const mediaUrl = await getMediaUrl(props.payload.imageUrl, props.ctx, props.conversation)
        await sendMessage(props, { type: 'image', mediaUrl })
      },
      markdown: async (props) => {
        await sendMessage(props, { type: 'text', text: props.payload.markdown })
      },
      audio: async (props) => {
        const mediaUrl = await getMediaUrl(props.payload.audioUrl, props.ctx, props.conversation)
        await sendMessage(props, { type: 'file', mediaUrl })
      },
      video: async (props) => {
        const mediaUrl = await getMediaUrl(props.payload.videoUrl, props.ctx, props.conversation)
        await sendMessage(props, { type: 'file', mediaUrl })
      },
      file: async (props) => {
        try {
          const mediaUrl = await getMediaUrl(props.payload.fileUrl, props.ctx, props.conversation)
          await sendMessage(props, { type: 'file', mediaUrl })
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

/**
 * Gets the media URL for sending in messages.
 * If the source URL is from Zendesk, uploads it to Zendesk's Attachments API.
 * Otherwise, returns the original URL as-is.
 * The reason for this is that Zendesk will fail the sendMessage request if the URL is from
 * another Sunco Conversation.
 */
async function getMediaUrl(sourceUrl: string, ctx: bp.Context, conversation: Conversation): Promise<string> {
  try {
    const hostname = new URL(sourceUrl).hostname
    if (hostname.endsWith('zendesk.com')) {
      return downloadAndUploadAttachment(sourceUrl, ctx, getSuncoConversationId(conversation))
    }
  } catch {
    // Invalid URL or error, return as-is
  }
  return sourceUrl
}

/**
 * Downloads a file from a URL and uploads it to Zendesk's Attachments API.
 * Returns the Zendesk media URL to use in messages.
 */
async function downloadAndUploadAttachment(
  sourceUrl: string,
  ctx: bp.Context,
  conversationId: string
): Promise<string> {
  const { appId, keyId, keySecret } = ctx.configuration

  // Download the file from the source URL
  const response = await axios.get(sourceUrl, {
    responseType: 'arraybuffer',
  })

  const contentType = response.headers['content-type'] || 'application/octet-stream'
  const fileBuffer = Buffer.from(response.data)

  // Extract filename from URL or use a default
  const urlPath = new URL(sourceUrl).pathname
  const filename = urlPath.split('/').pop() || 'file'

  const formData = new FormData()
  const blob = new Blob([fileBuffer], { type: contentType })
  formData.append('source', blob, filename)

  // Upload via axios instead of the SDK because the sunshine-conversations-client SDK
  // uses superagent internally, which doesn't properly handle Node.js File/Blob objects.
  // Superagent expects stream-like objects with .on() method, but Node.js 18+ File/Blob
  // don't implement stream interfaces. Using axios with native FormData works correctly.
  const uploadResponse = await axios.post(`https://api.smooch.io/v2/apps/${appId}/attachments`, formData, {
    params: {
      access: 'public',
      for: 'message',
      conversationId,
    },
    auth: {
      username: keyId,
      password: keySecret,
    },
  })

  const mediaUrl = uploadResponse.data?.attachment?.mediaUrl
  if (!mediaUrl) {
    throw new RuntimeError('Failed to upload attachment to Zendesk: no mediaUrl returned')
  }

  return mediaUrl
}

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

  const { messages } = await client.messages.postMessage(
    ctx.configuration.appId,
    getSuncoConversationId(conversation),
    data
  )

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
