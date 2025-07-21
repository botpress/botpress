import { RuntimeError } from '@botpress/sdk'
import { MessengerTypes, MessengerClient } from 'messaging-api-messenger'
import { create as createMessengerClient } from '../misc/messenger-client'
import { Card, Carousel, Choice, Dropdown, MessengerOutMessageAttachment, SendMessageProps } from '../misc/types'
import { getGoogleMapLinkFromLocation, getRecipientId } from '../misc/utils'
import * as bp from '.botpress'

const channel: bp.IntegrationProps['channels']['channel'] = {
  messages: {
    text: async ({ payload, ...props }) =>
      sendMessage(props, async (messenger, recipientId) => {
        props.logger.forBot().debug('Sending text message from bot to Messenger:', payload.text)
        return messenger.sendText(recipientId, payload.text)
      }),
    image: async ({ payload, ...props }) =>
      sendMessage(props, async (messenger, recipientId) => {
        props.logger.forBot().debug('Sending image message from bot to Messenger:', payload.imageUrl)
        return messenger.sendImage(recipientId, payload.imageUrl)
      }),
    markdown: async ({ payload, ...props }) =>
      sendMessage(props, async (messenger, recipientId) => {
        props.logger.forBot().debug('Sending markdown message from bot to Messenger:', payload.markdown)
        return messenger.sendText(recipientId, payload.markdown)
      }),
    audio: async ({ payload, ...props }) =>
      sendMessage(props, async (messenger, recipientId) => {
        props.logger.forBot().debug('Sending audio message from bot to Messenger:', payload.audioUrl)
        return messenger.sendAudio(recipientId, payload.audioUrl)
      }),
    video: async ({ payload, ...props }) =>
      sendMessage(props, async (messenger, recipientId) => {
        props.logger.forBot().debug('Sending video message from bot to Messenger:', payload.videoUrl)
        return messenger.sendVideo(recipientId, payload.videoUrl)
      }),
    file: async ({ payload, ...props }) =>
      sendMessage(props, async (messenger, recipientId) => {
        props.logger.forBot().debug('Sending file message from bot to Messenger:', payload.fileUrl)
        return messenger.sendFile(recipientId, payload.fileUrl)
      }),
    location: async ({ payload, ...props }) =>
      sendMessage(props, async (messenger, recipientId) => {
        const googleMapLink = getGoogleMapLinkFromLocation(payload)

        props.logger.forBot().debug('Sending location message from bot to Messenger:', googleMapLink)
        return messenger.sendText(recipientId, googleMapLink)
      }),
    carousel: async ({ payload, ...props }) =>
      sendMessage(props, async (messenger, recipientId) => {
        const carouselMessage = getCarouselMessage(payload)

        props.logger.forBot().debug('Sending carousel message from bot to Messenger:', carouselMessage)
        return messenger.sendMessage(recipientId, getCarouselMessage(payload))
      }),
    card: async ({ payload, ...props }) =>
      sendMessage(props, async (messenger, recipientId) => {
        const cardMessage = getCarouselMessage({ items: [payload] })

        props.logger.forBot().debug('Sending card message from bot to Messenger:', cardMessage)
        return messenger.sendMessage(recipientId, cardMessage)
      }),
    dropdown: async ({ payload, ...props }) =>
      sendMessage(props, async (messenger, recipientId) => {
        const choiceMessage = getChoiceMessage(payload)

        props.logger.forBot().debug('Sending dropdown message from bot to Messenger:', choiceMessage)
        return messenger.sendMessage(recipientId, choiceMessage)
      }),
    choice: async ({ payload, ...props }) =>
      sendMessage(props, async (messenger, recipientId) => {
        const choiceMessage = getChoiceMessage(payload)

        props.logger.forBot().debug('Sending choice message from bot to Messenger:', choiceMessage)
        return messenger.sendMessage(recipientId, getChoiceMessage(payload))
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
  { ack, client, ctx, conversation }: SendMessageProps,
  send: (client: MessengerClient, recipientId: string) => Promise<{ messageId: string }>
) {
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
