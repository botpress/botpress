import { posthogHelper } from '@botpress/common'
import { INTEGRATION_NAME } from 'integration.definition'
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
import { splitTextMessageIfNeeded } from '../misc/split-text-message'
import { sleep } from '../misc/util'
import { repeat } from '../repeat'
import * as card from './message-types/card'
import * as carousel from './message-types/carousel'
import * as choice from './message-types/choice'
import * as dropdown from './message-types/dropdown'
import * as image from './message-types/image'
import * as bp from '.botpress'

const PART_DELAY_MS = 1000

export const channel: bp.IntegrationProps['channels']['channel'] = {
  messages: {
    text: async ({ payload, ...props }) => {
      if (payload.text.trim().length === 0) {
        props.logger
          .forBot()
          .warn(`Message ${props.message.id} skipped: payload text must contain at least one non-invisible character.`)
        return
      }
      const text = convertMarkdownToWhatsApp(payload.text)
      const messagesToSend = splitTextMessageIfNeeded(text)

      if (messagesToSend.length === 0) {
        await posthogHelper.sendPosthogEvent(
          {
            distinctId: props.conversation.tags.userPhone ?? props.conversation.id ?? props.message.id ?? 'no id',
            event: 'no_message_to_send',
            properties: {
              from: 'channel',
              messageId: props.message.id,
            },
          },
          { integrationName: INTEGRATION_NAME, key: bp.secrets.POSTHOG_KEY }
        )
        props.logger.forBot().warn(`Message ${props.message.id} skipped: no message to send.`)
        return
      }

      for (let i = 0; i < messagesToSend.length; i++) {
        if (i > 0) {
          // Adding delay between parts to avoid messages being sent out of order
          await sleep(PART_DELAY_MS)
        }

        await _send({
          client: props.client,
          ctx: props.ctx,
          conversation: props.conversation,
          message: new Text(messagesToSend[i]!),
          ack: props.ack,
          logger: props.logger,
        })
      }
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
    bloc: async ({ payload, ...props }) => {
      if (!payload.items) {
        return
      }
      for (const item of payload.items) {
        if (!item) {
          continue
        }
        switch (item.type) {
          case 'text':
            if (item.payload.text.trim().length === 0) {
              props.logger
                .forBot()
                .warn(
                  `Message ${props.message.id} skipped: payload text must contain at least one non-invisible character.`
                )
              break
            }
            const blocText = convertMarkdownToWhatsApp(item.payload.text)
            const messagesToSend = splitTextMessageIfNeeded(blocText)
            for (let i = 0; i < messagesToSend.length; i++) {
              if (i > 0) {
                // Adding delay between parts to avoid messages being sent out of order
                await sleep(PART_DELAY_MS)
              }

              await _send({
                client: props.client,
                ctx: props.ctx,
                conversation: props.conversation,
                message: new Text(messagesToSend[i]!),
                ack: props.ack,
                logger: props.logger,
              })
            }
            break
          case 'image':
            await _send({
              ...props,
              message: await image.generateOutgoingMessage({ payload: item.payload, logger: props.logger }),
            })
            break
          case 'audio':
            await _send({ ...props, message: new Audio(item.payload.audioUrl.trim(), false) })
            break
          case 'video':
            await _send({
              ...props,
              message: new Video(item.payload.videoUrl.trim(), false),
            })
            break
          case 'file':
            const title = item.payload.title?.trim()
            const url = item.payload.fileUrl.trim()
            const inputFilename = item.payload.filename?.trim()
            let filename = inputFilename || title || 'file'
            const fileExtension = _extractFileExtension(filename)
            if (!fileExtension) {
              filename += _extractFileExtension(url) ?? ''
            }
            await _send({ ...props, message: new Document(url, false, title, filename) })
            break
          case 'location':
            await _send({ ...props, message: new Location(item.payload.longitude, item.payload.latitude) })
            break
          default:
            props.logger.forBot().warn('The type passed in bloc is not supported')
            continue
        }
      }
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

// From https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes#throttling-errors
// Only contains codes for errors that can be recovered from by waiting
const THROTTLING_CODES = new Set([
  80007, // WABA/app rate limit
  130429, // Cloud API throughput reached
  131056, // Pair rate limit (same sender↔recipient)
])

function backoffDelayMs(attempt: number) {
  // Helper function for backoff delay with jitter. Uses Meta recommendation for exponential curve
  // https://developers.facebook.com/docs/whatsapp/cloud-api/overview/?locale=en_US#pair-rate-limits
  const baseMs = Math.pow(4, attempt) * 1000
  const jitter = 0.75 + Math.random() * 0.5
  return Math.floor(baseMs * jitter)
}

const MAX_ATTEMPT = 3

async function _send({ client, ctx, conversation, logger, message, ack }: SendMessageProps) {
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

  const feedback = await repeat(
    async (i) => {
      if (i > 0) {
        logger.forBot().info(`Retrying to send ${messageType} message to WhatsApp (attempt ${i + 1}/${MAX_ATTEMPT})...`)
      }

      const result = await whatsapp.sendMessage(botPhoneNumberId, userPhoneNumber, message)
      const repeat = 'error' in result && THROTTLING_CODES.has(result.error?.code ?? 0)
      return {
        repeat,
        result,
      }
    },
    {
      maxIterations: MAX_ATTEMPT,
      backoff: backoffDelayMs,
    }
  )

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
