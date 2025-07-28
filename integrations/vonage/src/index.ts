import { RuntimeError } from '@botpress/client'
import * as sdk from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import * as formatter from './payloadFormatter'
import { sendMessage } from './vonage'
import * as bp from '.botpress'

const integration = new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    async startConversation(props) {
      const vonageChannel = props.input.conversation.channel
      const channelId = props.input.conversation.channelId
      const userId = props.input.conversation.userId

      if (!(vonageChannel && channelId && userId)) {
        throw new sdk.RuntimeError('Could not create conversation: missing channel, channelId or userId')
      }

      const { conversation } = await props.client.getOrCreateConversation({
        tags: {
          channel: vonageChannel,
          channelId,
          userId,
        },
        channel: 'channel',
      })

      return {
        conversationId: conversation.id,
      }
    },
    async getOrCreateUser(props) {
      const vonageChannel = props.input.user.channel
      const userId = props.input.user.userId
      if (!(vonageChannel && userId)) {
        throw new sdk.RuntimeError('Could not create a user: missing channel or userId')
      }

      const { user } = await props.client.getOrCreateUser({
        tags: {
          channel: vonageChannel,
          userId,
        },
      })

      return {
        userId: user.id,
      }
    },
  },
  channels: {
    channel: {
      messages: {
        text: async (props) => {
          const payload = { message_type: 'text', text: props.payload.text }
          await sendMessage(props, payload)
        },
        image: async (props) => {
          const payload = { message_type: 'image', image: { url: props.payload.imageUrl } }
          await sendMessage(props, payload)
        },
        audio: async (props) => {
          const payload = { message_type: 'audio', audio: { url: props.payload.audioUrl } }
          await sendMessage(props, payload)
        },
        video: async (props) => {
          const payload = { message_type: 'video', video: { url: props.payload.videoUrl } }
          await sendMessage(props, payload)
        },
        file: async (props) => {
          const payload = { message_type: 'file', file: { url: props.payload.fileUrl } }
          await sendMessage(props, payload)
        },
        location: async (props) => {
          const payload = formatter.formatLocationPayload(props.payload)
          await sendMessage(props, payload)
        },
        carousel: async (props) => {
          const payloads = formatter.formatCarouselPayload(props.payload)
          for (const payload of payloads) {
            await sendMessage(props, payload)
          }
        },
        card: async (props) => {
          const payload = formatter.formatCardPayload(props.payload)
          await sendMessage(props, payload)
        },
        dropdown: async (props) => {
          const payload = formatter.formatDropdownPayload(props.payload)
          await sendMessage(props, payload)
        },
        choice: async (props) => {
          const payload = formatter.formatChoicePayload(props.payload)
          await sendMessage(props, payload)
        },
        bloc: () => {
          throw new RuntimeError('Not implemented')
        },
      },
    },
  },
  handler: async ({ req, client }) => {
    if (!req.body) {
      console.warn('Handler received an empty body')
      return
    }

    const data = JSON.parse(req.body)

    console.info(`Handler received request of type ${data.message_type}`)

    if (data.message_type !== 'text') {
      throw new Error('Handler received an invalid message type')
    }

    const { conversation } = await client.getOrCreateConversation({
      channel: 'channel',
      tags: {
        channel: data.channel,
        channelId: data.to,
        userId: data.from,
      },
    })

    const { user } = await client.getOrCreateUser({
      tags: {
        channel: data.channel,
        userId: data.from,
      },
    })

    await client.createMessage({
      tags: { id: data.message_uuid },
      type: 'text',
      userId: user.id,
      conversationId: conversation.id,
      payload: { text: data.text },
    })
  },
})

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})
