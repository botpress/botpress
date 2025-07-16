import { RuntimeError } from '@botpress/sdk'
import { getCredentials, InstagramClient } from 'src/misc/client'
import { formatGoogleMapLink, getCarouselMessage, getChoiceMessage } from 'src/misc/utils'
import * as bp from '.botpress'

export const channel: bp.IntegrationProps['channels']['channel'] = {
  messages: {
    text: async (props) =>
      _sendMessage(props, async (client, recipientId) => {
        return client.sendTextMessage(recipientId, props.payload.text)
      }),
    image: async (props) =>
      _sendMessage(props, async (client, recipientId) => {
        return client.sendImageMessage(recipientId, props.payload.imageUrl)
      }),
    audio: async (props) =>
      _sendMessage(props, async (client, recipientId) => {
        return client.sendAudioMessage(recipientId, props.payload.audioUrl)
      }),
    video: async (props) =>
      _sendMessage(props, async (client, recipientId) => {
        return client.sendVideoMessage(recipientId, props.payload.videoUrl)
      }),
    location: async (props) =>
      _sendMessage(props, async (client, recipientId) => {
        const googleMapLink = formatGoogleMapLink(props.payload)
        return client.sendTextMessage(recipientId, googleMapLink)
      }),
    carousel: async (props) =>
      _sendMessage(props, async (instagram, recipientId) => {
        return instagram.sendMessage(recipientId, getCarouselMessage(props.payload))
      }),
    card: async (props) =>
      _sendMessage(props, async (instagram, recipientId) => {
        const cardMessage = getCarouselMessage({ items: [props.payload] })
        return instagram.sendMessage(recipientId, cardMessage)
      }),
    dropdown: async (props) =>
      _sendMessage(props, async (instagram, recipientId) => {
        const choiceMessage = getChoiceMessage(props.payload)
        return instagram.sendMessage(recipientId, choiceMessage)
      }),
    choice: async (props) =>
      _sendMessage(props, async (instagram, recipientId) => {
        return instagram.sendMessage(recipientId, getChoiceMessage(props.payload))
      }),
    bloc: async (props) => {
      for (const item of props.payload.items) {
        if (item.type === 'text') {
          await _sendMessage(props, async (instagram, recipientId) => {
            return instagram.sendTextMessage(recipientId, item.payload.text)
          })
        } else if (item.type === 'image') {
          await _sendMessage(props, async (instagram, recipientId) => {
            return instagram.sendImageMessage(recipientId, item.payload.imageUrl)
          })
        } else if (item.type === 'audio') {
          await _sendMessage(props, async (instagram, recipientId) => {
            return instagram.sendAudioMessage(recipientId, item.payload.audioUrl)
          })
        } else if (item.type === 'video') {
          await _sendMessage(props, async (instagram, recipientId) => {
            return instagram.sendVideoMessage(recipientId, item.payload.videoUrl)
          })
        } else if (item.type === 'location') {
          await _sendMessage(props, async (instagram, recipientId) => {
            const googleMapLink = formatGoogleMapLink(item.payload)
            return instagram.sendTextMessage(recipientId, googleMapLink)
          })
        } else {
          props.logger.forBot().warn(`Unsupported bloc item type: ${item.type}`)
        }
      }
    },
  },
}

type Channels = bp.Integration['channels']
type Messages = Channels[keyof Channels]['messages']
type MessageHandler = Messages[keyof Messages]
type SendMessageProps = Parameters<MessageHandler>[0]
async function _sendMessage(
  { ack, ctx, client, conversation, logger, payload, type }: SendMessageProps,
  sendTypeSpecificMessage: (client: InstagramClient, toInstagramId: string) => Promise<{ message_id: string }>
) {
  const { accessToken, instagramId } = await getCredentials(client, ctx)
  const metaClient = new InstagramClient(logger, { accessToken, instagramId })
  const recipientId = getRecipientId(conversation)

  logger.forBot().debug(`Sending message of type ${type} from bot to Instagram user ${recipientId}:`, payload)
  const { message_id } = await sendTypeSpecificMessage(metaClient, recipientId)

  await ack({
    tags: {
      id: message_id,
      senderId: instagramId,
      recipientId,
    },
  })
}

function getRecipientId(conversation: SendMessageProps['conversation']): string {
  const recipientId = conversation.tags.id

  if (!recipientId) {
    throw new RuntimeError(`No recipient id found for user ${conversation.id}`)
  }

  return recipientId
}
