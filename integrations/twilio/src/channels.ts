import { isApiError } from '@botpress/client'
import { posthogHelper } from '@botpress/common'
import { INTEGRATION_NAME, INTEGRATION_VERSION } from 'integration.definition'
import { transformMarkdownForTwilio } from './markdown-to-twilio'
import { getTwilioClient } from './twilio'
import { getPhoneNumbers, getTwilioChannelType, renderCard, renderChoiceMessage } from './utils'
import * as bp from '.botpress'

type Channels = bp.Integration['channels']
type Messages = Channels[keyof Channels]['messages']
type MessageHandler = Messages[keyof Messages]
type MessageHandlerProps = Parameters<MessageHandler>[0]

type SendMessageProps = Pick<MessageHandlerProps, 'ctx' | 'conversation' | 'ack' | 'logger'> & {
  mediaUrl?: string
  text?: string
}

function renderLocation({
  title,
  address,
  latitude,
  longitude,
}: {
  latitude: number
  longitude: number
  title?: string
  address?: string
}): string {
  const messageParts: string[] = []

  if (title) {
    messageParts.push(title, '')
  }
  if (address) {
    messageParts.push(address, '')
  }
  messageParts.push(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`)

  return messageParts.join('\n')
}

async function sendMessage({ ctx, conversation, ack, mediaUrl, text, logger }: SendMessageProps) {
  const twilioClient = getTwilioClient(ctx)
  const { to, from } = getPhoneNumbers(conversation)
  const twilioChannel = getTwilioChannelType(to)
  let body = text
  if (body !== undefined) {
    try {
      body = transformMarkdownForTwilio(body, twilioChannel)
    } catch (thrown) {
      const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
      logger.forBot().debug('Failed to transform markdown - Error:', errMsg)
      const distinctId = isApiError(thrown) ? thrown.id : undefined
      await posthogHelper.sendPosthogEvent(
        {
          distinctId: distinctId ?? 'no id',
          event: 'unhandled_markdown',
          properties: { errMsg },
        },
        { integrationName: INTEGRATION_NAME, integrationVersion: INTEGRATION_VERSION, key: bp.secrets.POSTHOG_KEY }
      )
    }
  }
  const { sid } = await twilioClient.messages.create({ to, from, mediaUrl: mediaUrl ? [mediaUrl] : undefined, body })
  await ack({ tags: { id: sid } })
}

export const channels = {
  channel: {
    messages: {
      text: async (props) => void (await sendMessage({ ...props, text: props.payload.text })),
      image: async (props) => void (await sendMessage({ ...props, mediaUrl: props.payload.imageUrl })),
      audio: async (props) => void (await sendMessage({ ...props, mediaUrl: props.payload.audioUrl })),
      video: async (props) => void (await sendMessage({ ...props, mediaUrl: props.payload.videoUrl })),
      file: async (props) => void (await sendMessage({ ...props, text: props.payload.fileUrl })),
      location: async (props) => void (await sendMessage({ ...props, text: renderLocation(props.payload) })),
      carousel: async (props) => {
        const {
          payload: { items },
        } = props
        const total = items.length
        for (const [i, card] of items.entries()) {
          await sendMessage({ ...props, text: renderCard(card, `${i + 1}/${total}`), mediaUrl: card.imageUrl })
        }
      },
      card: async (props) => {
        const { payload: card } = props
        await sendMessage({ ...props, text: renderCard(card), mediaUrl: card.imageUrl })
      },
      dropdown: async (props) => {
        await sendMessage({ ...props, text: renderChoiceMessage(props.payload) })
      },
      choice: async (props) => {
        await sendMessage({ ...props, text: renderChoiceMessage(props.payload) })
      },
      bloc: async (props) => {
        for (const item of props.payload.items) {
          switch (item.type) {
            case 'text':
              await sendMessage({ ...props, text: item.payload.text })
              break
            case 'markdown':
              await sendMessage({ ...props, text: item.payload.markdown })
              break
            case 'image':
              await sendMessage({ ...props, mediaUrl: item.payload.imageUrl })
              break
            case 'video':
              await sendMessage({ ...props, mediaUrl: item.payload.videoUrl })
              break
            case 'audio':
              await sendMessage({ ...props, mediaUrl: item.payload.audioUrl })
              break
            case 'file':
              await sendMessage({ ...props, text: item.payload.fileUrl })
              break
            case 'location':
              await sendMessage({ ...props, text: renderLocation(item.payload) })
              break
            default:
              break
          }
        }
      },
    },
  },
} satisfies bp.IntegrationProps['channels']
