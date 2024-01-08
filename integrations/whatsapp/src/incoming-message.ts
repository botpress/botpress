/* eslint-disable max-lines-per-function */
import { IntegrationLogger } from 'src'
import { WhatsAppMessage, WhatsAppValue } from './whatsapp-types'
import * as bp from '.botpress'

export async function handleIncomingMessage(
  message: WhatsAppMessage,
  value: WhatsAppValue,
  client: bp.Client,
  logger: IntegrationLogger
) {
  if (message.type) {
    const { conversation } = await client.getOrCreateConversation({
      channel: 'channel',
      tags: {
        userPhone: message.from,
        phoneNumberId: value.metadata.phone_number_id,
      },
    })

    if (value.contacts.length > 0) {
      const { user } = await client.getOrCreateUser({
        tags: {
          userId: value.contacts[0] ? value.contacts[0].wa_id : '',
          name: value.contacts[0] ? value.contacts[0]?.profile.name : '',
        },
        name: value.contacts[0] ? value.contacts[0]?.profile.name : '',
      })

      if (message.text) {
        logger.forBot().debug('Received text message from Whatsapp:', message.text.body)

        await client.createMessage({
          tags: { id: message.id },
          type: 'text',
          payload: { text: message.text.body },
          userId: user.id,
          conversationId: conversation.id,
        })
      } else if (message.button) {
        logger.forBot().debug('Received button message from Whatsapp:', message.button)

        await client.createMessage({
          tags: { id: message.id },
          type: 'text',
          payload: {
            text: message.button.text,
          },
          userId: user.id,
          conversationId: conversation.id,
        })
      } else if (message.location) {
        logger.forBot().debug('Received location message from Whatsapp:', JSON.stringify(message.location))

        await client.createMessage({
          tags: { id: message.id },
          type: 'location',
          payload: {
            latitude: Number(message.location.latitude),
            longitude: Number(message.location.longitude),
            address: message.location.address,
            title: message.location.name,
          },
          userId: user.id,
          conversationId: conversation.id,
        })
      } else if (message.image) {
        logger.forBot().debug('Received image message from Whatsapp:', message.button)

        await client.createMessage({
          tags: { id: message.id },
          type: 'whatsappImage' as any, // Note: We cast this to avoid defining a custom message type which would involve having to support it as an outgoing message as well.
          payload: {
            image: {
              id: message.image.id,
              mime_type: message.image.mime_type,
              sha256: message.image.sha256,
            },
          },
          userId: user.id,
          conversationId: conversation.id,
        })
      } else if (message.audio) {
        logger.forBot().debug('Received audio message from Whatsapp:', message.button)

        await client.createMessage({
          tags: { id: message.id },
          type: 'whatsappAudio' as any,
          payload: {
            audio: {
              id: message.audio.id,
              voice: message.audio.voice,
              mime_type: message.audio.mime_type,
              sha256: message.audio.sha256,
            },
          },
          userId: user.id,
          conversationId: conversation.id,
        })
      } else if (message.document) {
        logger.forBot().debug('Received document message from Whatsapp:', message.button)

        await client.createMessage({
          tags: { id: message.id },
          type: 'whatsappDocument' as any,
          payload: {
            document: {
              id: message.document.id,
              filename: message.document.filename,
              mime_type: message.document.mime_type,
              sha256: message.document.sha256,
            },
          },
          userId: user.id,
          conversationId: conversation.id,
        })
      } else if (message.interactive) {
        if (message.interactive.type === 'button_reply') {
          logger.forBot().debug('Received button reply from Whatsapp:', message.interactive.button_reply)

          await client.createMessage({
            tags: { id: message.id },
            type: 'text',
            payload: {
              text: message.interactive.button_reply?.id!,
              // TODO: declare in definition
              // metadata: message.interactive.button_reply?.title,
            },
            userId: user.id,
            conversationId: conversation.id,
          })
        } else if (message.interactive.type === 'list_reply') {
          logger.forBot().debug('Received list reply from Whatsapp:', message.interactive.list_reply)

          await client.createMessage({
            tags: { id: message.id },
            type: 'text',
            payload: {
              text: message.interactive.list_reply?.id!,
              // TODO: declare in definition
              // metadata: message.interactive.list_reply?.title,
            },
            userId: user.id,
            conversationId: conversation.id,
          })
        } else {
          logger.forBot().warn(`Unhandled interactive type: ${JSON.stringify(message.interactive.type)}`)
        }
      } else {
        logger.forBot().warn(`Unhandled message type: ${JSON.stringify(message)}`)
      }
    } else {
      logger.forBot().warn('Ignored message from Whatsapp because it did not have any contacts')
    }
  }
}
