import { RuntimeError } from '@botpress/sdk'
import { MessengerTypes, MessengerClient } from 'messaging-api-messenger'
import { createAuthenticatedMessengerClient } from '../misc/messenger-client'
import {
  Card,
  Carousel,
  Choice,
  Dropdown,
  MessengerOutMessageAttachment,
  SendMessengerMessageProps,
} from '../misc/types'
import { getGoogleMapLinkFromLocation, getEndUserMessengerId } from '../misc/utils'
import * as bp from '.botpress'

const channel: bp.IntegrationProps['channels']['channel'] = {
  messages: {
    text: async (props) =>
      _sendMessage(props, async (messenger, recipient) => {
        return messenger.sendText(recipient, props.payload.text)
      }),
    image: async (props) =>
      _sendMessage(props, async (messenger, recipient) => {
        return messenger.sendImage(recipient, props.payload.imageUrl)
      }),
    audio: async (props) =>
      _sendMessage(props, async (messenger, recipient) => {
        return messenger.sendAudio(recipient, props.payload.audioUrl)
      }),
    video: async (props) =>
      _sendMessage(props, async (messenger, recipient) => {
        return messenger.sendVideo(recipient, props.payload.videoUrl)
      }),
    file: async (props) =>
      _sendMessage(props, async (messenger, recipient) => {
        return messenger.sendFile(recipient, props.payload.fileUrl)
      }),
    location: async (props) =>
      _sendMessage(props, async (messenger, recipient) => {
        const googleMapLink = getGoogleMapLinkFromLocation(props.payload)
        return messenger.sendText(recipient, googleMapLink)
      }),
    carousel: async (props) =>
      _sendMessage(props, async (messenger, recipient) => {
        return messenger.sendMessage(recipient, _getCarouselMessage(props.payload))
      }),
    card: async (props) =>
      _sendMessage(props, async (messenger, recipient) => {
        return messenger.sendMessage(recipient, _getCarouselMessage({ items: [props.payload] }))
      }),
    dropdown: async (props) =>
      _sendMessage(props, async (messenger, recipient) => {
        return messenger.sendMessage(recipient, _getChoiceMessage(props.payload))
      }),
    choice: async (props) =>
      _sendMessage(props, async (messenger, recipient) => {
        return messenger.sendMessage(recipient, _getChoiceMessage(props.payload))
      }),
    bloc: () => {
      throw new RuntimeError('This message type is not supported')
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

async function _sendMessage(
  { ack, client, ctx, conversation, logger, type, payload }: SendMessengerMessageProps,
  send: (client: MessengerClient, recipient: MessengerTypes.PsidOrRecipient) => Promise<{ messageId: string }>
) {
  const commentId = payload.commentId
  let recipient: MessengerTypes.PsidOrRecipient
  if (commentId) {
    recipient = { commentId }
  } else {
    recipient = getEndUserMessengerId(conversation)
  }

  logger
    .forBot()
    .debug(
      `Sending ${type} message ${commentId ? 'as private reply ' : ''}from bot to Messenger: ${_formatPayloadToStr(payload)}`
    )
  const messengerClient = await createAuthenticatedMessengerClient(client, ctx)
  const { messageId } = await send(messengerClient, recipient)
  await ack({ tags: { id: messageId, commentId } })

  if (commentId && conversation.tags.lastCommentId !== commentId) {
    await client.updateConversation({
      id: conversation.id,
      tags: {
        lastCommentId: commentId,
      },
    })
  }
}

function _formatPayloadToStr(payload: any): string {
  return Object.entries(payload)
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join(', ')
}

function _getCarouselMessage(payload: Carousel): MessengerTypes.AttachmentMessage {
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

function _getChoiceMessage(payload: Choice | Dropdown): MessengerTypes.TextMessage {
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
