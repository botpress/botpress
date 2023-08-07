import type { Conversation } from '@botpress/client'
import type { IntegrationContext, AckFunction } from '@botpress/sdk'
import { name } from 'integration.definition'
import { WhatsAppAPI } from 'whatsapp-api-js'
import type { Contacts } from 'whatsapp-api-js/types/messages/contacts'
import type { Interactive } from 'whatsapp-api-js/types/messages/interactive'
import type Location from 'whatsapp-api-js/types/messages/location'
import type { Image, Audio, Document, Sticker, Video } from 'whatsapp-api-js/types/messages/media'
import type Reaction from 'whatsapp-api-js/types/messages/reaction'
import type { Template } from 'whatsapp-api-js/types/messages/template'
import type Text from 'whatsapp-api-js/types/messages/text'
import { IntegrationLogger } from '.'
import { sleep } from './util'

export type OutgoingMessage =
  | Text
  | Audio
  | Document
  | Image
  | Sticker
  | Video
  | Location
  | Contacts
  | Interactive
  | Template
  | Reaction

export async function send({
  ctx,
  conversation,
  message,
  ack,
  logger,
}: {
  ctx: IntegrationContext
  conversation: Conversation
  ack: AckFunction
  message: OutgoingMessage
  logger: IntegrationLogger
}) {
  const whatsapp = new WhatsAppAPI(ctx.configuration.accessToken)
  const phoneNumberId = ctx.configuration.phoneNumberId
  const to = conversation.tags[`${name}:userPhone`]
  const messageType = message._

  if (!to) {
    logger
      .forBot()
      .error(
        "Cannot send message to Whatsapp because the phone number ID isn't specified yet in the Whatsapp configuration of the bot."
      )
    return
  }

  const feedback = await whatsapp.sendMessage(phoneNumberId, to, message)

  if (feedback?.error) {
    logger.forBot().error(`Failed to send ${messageType} message from bot to Whatsapp. Reason:`, feedback)
    return
  }

  const messageId = feedback?.messages?.[0]?.id

  if (messageId) {
    logger.forBot().debug(`Successfully sent ${messageType} message from bot to Whatsapp:`, message)
    await ack({ tags: { [`${name}:id`]: messageId } })
  } else {
    logger
      .forBot()
      .warn(
        `A ${messageType} message from the bot was sent to Whatsapp but the message ID wasn't found in their response. Response: ${JSON.stringify(
          feedback
        )}`
      )
  }
}

export async function sendMany({
  ctx,
  conversation,
  ack,
  generator,
  logger,
}: {
  ctx: IntegrationContext
  conversation: Conversation
  ack: AckFunction
  generator: Generator<OutgoingMessage, void, unknown>
  logger: IntegrationLogger
}) {
  for (const message of generator) {
    // Sending multiple messages in sequence does not guarantee delivery order on the client-side.
    // In order for messages to appear in order on the client side, adding some sleep in between each seems to work.
    await sleep(1000)
    await send({ ctx, conversation, ack, message, logger })
  }
}
