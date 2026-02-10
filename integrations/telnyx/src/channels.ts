import { isApiError } from '@botpress/client'
import { posthogHelper } from '@botpress/common'
import { INTEGRATION_NAME, INTEGRATION_VERSION } from 'integration.definition'
import { getTelnyxClient } from './telnyx'
import { getPhoneNumbers } from './utils'
import * as bp from '.botpress'

type Channels = bp.Integration['channels']
type Messages = Channels[keyof Channels]['messages']
type MessageHandler = Messages[keyof Messages]
type MessageHandlerProps = Parameters<MessageHandler>[0]

type SendMessageProps = Pick<MessageHandlerProps, 'ctx' | 'conversation' | 'ack' | 'logger'> & {
  text?: string
}

async function sendMessage({ ctx, conversation, ack, text, logger }: SendMessageProps) {
  const telnyxClient = getTelnyxClient(ctx)
  const { to, from } = getPhoneNumbers(conversation)

  await telnyxClient.messages.create({
    to,
    from,
    text,
  })

  await ack({ tags: { id: `${Date.now()}` } })
}

export const channels = {
  channel: {
    messages: {
      text: async (props) => void (await sendMessage({ ...props, text: props.payload.text })),
      image: async (props) => void (await sendMessage({ ...props, text: props.payload.imageUrl })),
      audio: async (props) => void (await sendMessage({ ...props, text: props.payload.audioUrl })),
      video: async (props) => void (await sendMessage({ ...props, text: props.payload.videoUrl })),
      file: async (props) => void (await sendMessage({ ...props, text: props.payload.fileUrl })),
      location: async (props) => void (await sendMessage({ ...props, text: props.payload.address || 'Location' })),
      carousel: async (props) => {
        const {
          payload: { items },
        } = props
        for (const [i, card] of items.entries()) {
          const cardText = `${i + 1}/${items.length}: ${card.title}\n${card.subtitle || ''}`
          await sendMessage({ ...props, text: cardText })
        }
      },
      card: async (props) => {
        const { payload: card } = props
        const cardText = `${card.title}\n${card.subtitle || ''}`
        await sendMessage({ ...props, text: cardText })
      },
      dropdown: async (props) => {
        const text = `${props.payload.text || ''}\n\n${props.payload.options.map((o, i) => `${i + 1}. ${o.label}`).join('\n')}`
        await sendMessage({ ...props, text })
      },
      choice: async (props) => {
        const text = `${props.payload.text || ''}\n\n${props.payload.options.map((o, i) => `${i + 1}. ${o.label}`).join('\n')}`
        await sendMessage({ ...props, text })
      },
      bloc: async (props) => {
        for (const item of props.payload.items) {
          switch (item.type) {
            case 'text':
              await sendMessage({ ...props, text: item.payload.text })
              break
            case 'image':
              await sendMessage({ ...props, text: item.payload.imageUrl })
              break
            case 'video':
              await sendMessage({ ...props, text: item.payload.videoUrl })
              break
            case 'audio':
              await sendMessage({ ...props, text: item.payload.audioUrl })
              break
            case 'file':
              await sendMessage({ ...props, text: item.payload.fileUrl })
              break
            case 'location':
              await sendMessage({ ...props, text: item.payload.address || 'Location' })
              break
            default:
              break
          }
        }
      },
    },
  },
} satisfies bp.IntegrationProps['channels']