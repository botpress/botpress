import { RuntimeError } from '@botpress/sdk'
import { MessengerTypes, MessengerClient } from 'messaging-api-messenger'
import { create as createMessengerClient } from '../misc/messenger-client'
import { Card, Carousel, Choice, Dropdown, MessengerOutMessageAttachment, SendMessageProps } from '../misc/types'
import { getGoogleMapLinkFromLocation, getRecipientId } from '../misc/utils'
import * as bp from '.botpress'

const channel: bp.IntegrationProps['channels']['channel'] = {
  messages: {
    text: async (props) =>
      sendMessage(props, async (messenger, recipientId) => {
        return messenger.sendText(recipientId, props.payload.text)
      }),
    image: async (props) =>
      sendMessage(props, async (messenger, recipientId) => {
        return messenger.sendImage(recipientId, props.payload.imageUrl)
      }),
    markdown: async (props) =>
      sendMessage(props, async (messenger, recipientId) => {
        return messenger.sendText(recipientId, props.payload.markdown)
      }),
    audio: async (props) =>
      sendMessage(props, async (messenger, recipientId) => {
        return messenger.sendAudio(recipientId, props.payload.audioUrl)
      }),
    video: async (props) =>
      sendMessage(props, async (messenger, recipientId) => {
        return messenger.sendVideo(recipientId, props.payload.videoUrl)
      }),
    file: async (props) =>
      sendMessage(props, async (messenger, recipientId) => {
        return messenger.sendFile(recipientId, props.payload.fileUrl)
      }),
    location: async (props) =>
      sendMessage(props, async (messenger, recipientId) => {
        const googleMapLink = getGoogleMapLinkFromLocation(props.payload)
        return messenger.sendText(recipientId, googleMapLink)
      }),
    carousel: async (props) =>
      sendMessage(props, async (messenger, recipientId) => {
        return messenger.sendMessage(recipientId, getCarouselMessage(props.payload))
      }),
    card: async (props) =>
      sendMessage(props, async (messenger, recipientId) => {
        return messenger.sendMessage(recipientId, getCarouselMessage({ items: [props.payload] }))
      }),
    dropdown: async (props) =>
      sendMessage(props, async (messenger, recipientId) => {
        return messenger.sendMessage(recipientId, getChoiceMessage(props.payload))
      }),
    choice: async (props) =>
      sendMessage(props, async (messenger, recipientId) => {
        return messenger.sendMessage(recipientId, getChoiceMessage(props.payload))
      }),
    bloc: () => {
      throw new RuntimeError('Not implemented')
    },
  },
}

export function formatCardElement(payload: Card) {
  const buttons: MessengerOutMessageAttachment[] = payload.actions.map((action) => {
    switch (action.action) {
      case 'postback':
        return {
          type: 'postback',
          title: action.label,
          payload: action.value,
        }
      case 'say':
        return {
          type: 'postback',
          title: action.label,
          payload: action.value,
        }
      case 'url':
        return {
          type: 'web_url',
          title: action.label,
          url: action.value,
        }
      default:
        throw new RuntimeError(`Unknown action type: ${action.action}`)
    }
  })
  return {
    title: payload.title,
    image_url: payload.imageUrl,
    subtitle: payload.subtitle,
    buttons,
  }
}

async function sendMessage(
  { ack, client, ctx, conversation, logger, type, payload }: SendMessageProps,
  send: (client: MessengerClient, recipientId: string) => Promise<{ messageId: string }>
) {
  logger.forBot().debug(
    `Sending ${type} message from bot to Messenger: ${Object.entries(payload)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ')}`
  )
  const messengerClient = await createMessengerClient(client, ctx)
  const recipientId = getRecipientId(conversation)
  const { messageId } = await send(messengerClient, recipientId)
  await ack({ tags: { id: messageId } })
}

function getCarouselMessage(payload: Carousel): MessengerTypes.AttachmentMessage {
  return {
    attachment: {
      type: 'template',
      payload: {
        templateType: 'generic',
        elements: payload.items.map(formatCardElement),
      },
    },
  }
}

function getChoiceMessage(payload: Choice | Dropdown): MessengerTypes.TextMessage {
  if (!payload.options.length) {
    return { text: payload.text }
  }

  if (payload.options.length > 13) {
    return {
      text: `${payload.text}\n\n${payload.options.map((o, idx) => `${idx + 1}. ${o.label}`).join('\n')}`,
    }
  }

  return {
    text: payload.text,
    quickReplies: payload.options.map((option) => ({
      contentType: 'text',
      title: option.label,
      payload: option.value,
    })),
  }
}

export default channel
