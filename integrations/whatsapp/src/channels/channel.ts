import { RuntimeError } from '@botpress/sdk'
import {
  Text,
  Audio,
  Document,
  Image,
  Sticker,
  Video,
  Location,
  Contacts,
  Interactive,
  Template,
  Reaction,
} from 'whatsapp-api-js/messages'
import { getAuthenticatedWhatsappClient } from '../auth'
import { WHATSAPP } from '../misc/constants'
import { convertMarkdownToWhatsApp } from '../misc/markdown-to-whatsapp-rtf'
import { sleep } from '../misc/util'
import * as card from './message-types/card'
import * as carousel from './message-types/carousel'
import * as choice from './message-types/choice'
import * as dropdown from './message-types/dropdown'
import * as image from './message-types/image'
import * as bp from '.botpress'

export const channel: bp.IntegrationProps['channels']['channel'] = {
  messages: {
    text: async ({ payload, ...props }) => {
      const text = convertMarkdownToWhatsApp(payload.text)
      await _send({ ...props, message: new Text(text) })
    },
    image: async ({ payload, logger, ...props }) => {
      await _send({
        ...props,
        logger,
        message: await image.generateOutgoingMessage({
          payload,
          logger,
        }),
      })
    },
    audio: async ({ payload, ...props }) => {
      await _send({
        ...props,
        message: new Audio(payload.audioUrl.trim(), false),
      })
    },
    video: async ({ payload, ...props }) => {
      await _send({
        ...props,
        message: new Video(payload.videoUrl.trim(), false),
      })
    },
    file: async ({ payload, ...props }) => {
      const title = payload.title?.trim()
      const url = payload.fileUrl.trim()
      const inputFilename = payload.filename?.trim()
      let filename = inputFilename || title || 'file'
      const fileExtension = _extractFileExtension(filename)
      if (!fileExtension) {
        filename += _extractFileExtension(url) ?? ''
      }
      await _send({
        ...props,
        message: new Document(url, false, title, filename),
      })
    },
    location: async ({ payload, ...props }) => {
      await _send({
        ...props,
        message: new Location(payload.longitude, payload.latitude),
      })
    },
    carousel: async ({ payload, logger, ...props }) => {
      await _sendMany({ ...props, logger, generator: carousel.generateOutgoingMessages(payload, logger) })
    },
    card: async ({ payload, logger, ...props }) => {
      await _sendMany({ ...props, logger, generator: card.generateOutgoingMessages(payload, logger) })
    },
    dropdown: async ({ payload, logger, ...props }) => {
      await _sendMany({
        ...props,
        logger,
        generator: dropdown.generateOutgoingMessages({ payload, logger }),
      })
    },
    choice: async ({ payload, logger, ...props }) => {
      if (payload.options.length <= WHATSAPP.INTERACTIVE_MAX_BUTTONS_COUNT) {
        await _sendMany({
          ...props,
          logger,
          generator: choice.generateOutgoingMessages({ payload, logger }),
        })
      } else {
        // If choice options exceeds the maximum number of buttons allowed by WhatsApp we use a dropdown instead to avoid buttons being split into multiple groups with a repeated message.
        await _sendMany({
          ...props,
          logger,
          generator: dropdown.generateOutgoingMessages({ payload, logger }),
        })
      }
    },
    bloc: () => {
      throw new RuntimeError('Not implemented')
    },
  },
}

type OutgoingMessage =
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

type SendMessageProps = {
  client: bp.Client
  ctx: bp.AnyMessageProps['ctx']
  conversation: bp.AnyMessageProps['conversation']
  ack: bp.AnyMessageProps['ack']
  logger: bp.AnyMessageProps['logger']
  message?: OutgoingMessage
}

async function _send({ client, ctx, conversation, message, ack, logger }: SendMessageProps) {
  if (!message) {
    logger.forBot().debug('No message to send')
    return
  }

  const whatsapp = await getAuthenticatedWhatsappClient(client, ctx)
  const botPhoneNumberId = conversation.tags.botPhoneNumberId
  const userPhoneNumber = conversation.tags.userPhone
  const messageType = message._type

  if (!botPhoneNumberId) {
    logger
      .forBot()
      .error("Cannot send message to WhatsApp because the bot phone number ID wasn't set in the conversation tags")
    return
  }

  if (!userPhoneNumber) {
    logger
      .forBot()
      .error("Cannot send message to WhatsApp because the user's phone number isn't set in the conversation tags")
    return
  }

  const feedback = await whatsapp.sendMessage(botPhoneNumberId, userPhoneNumber, message)
  if ('error' in feedback) {
    logger
      .forBot()
      .error(
        `Failed to send ${messageType} message from bot to WhatsApp. Reason:`,
        feedback.error?.message ?? 'Unknown error'
      )
    return
  }

  if (!('messages' in feedback)) {
    logger
      .forBot()
      .error(
        `A ${messageType} message from the bot was sent to WhatsApp but no messages were found in their response. Response: ${JSON.stringify(feedback)}`
      )
    return
  }

  logger.forBot().debug(`Successfully sent ${messageType} message from bot to WhatsApp:`, message)
  await ack({ tags: { id: feedback.messages[0].id } })
}

async function _sendMany({
  client,
  ctx,
  conversation,
  ack,
  generator,
  logger,
}: Omit<SendMessageProps, 'message'> & { generator: Generator<OutgoingMessage, void, unknown> }) {
  try {
    for (const message of generator) {
      // Sending multiple messages in sequence does not guarantee delivery order on the client-side.
      // In order for messages to appear in order on the client side, adding some sleep in between each seems to work.
      await sleep(1000)
      await _send({ ctx, conversation, ack, message, logger, client })
    }
  } catch (err) {
    logger.forBot().error('Failed to generate messages for sending to WhatsApp. Reason:', err)
  }
}

function _extractFileExtension(filename: string): string | undefined {
  const filenameParts = filename.split('.')
  return filenameParts.length > 1 ? `.${filenameParts.at(-1)}` : undefined
}
