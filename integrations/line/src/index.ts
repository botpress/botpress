import { RuntimeError } from '@botpress/client'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { messagingApi as lineMessagingApi } from '@line/bot-sdk'
import crypto from 'crypto'
import * as bp from '.botpress'

type MessageHandlerProps = bp.AnyMessageProps
type SendOrReplyLineProps = Pick<MessageHandlerProps, 'ctx' | 'conversation' | 'client' | 'ack'>

const DEFAULT_TIMEOUT_MS = 5000
const LOADING_TIMEOUT_MULTIPLE = 5
const MAX_TIMEOUT_SECONDS = 60

const replyOrSendLineMessage = async (props: SendOrReplyLineProps, message: lineMessagingApi.Message) => {
  const { ctx, conversation, client, ack } = props
  const config = {
    channelAccessToken: ctx.configuration.channelAccessToken,
  }

  const lineClient = new lineMessagingApi.MessagingApiClient(config)

  const { state } = await client.getState({
    id: conversation.id,
    name: 'conversation',
    type: 'conversation',
  })
  const replyToken = state.payload.replyToken
  try {
    let lineResponse: lineMessagingApi.ReplyMessageResponse | lineMessagingApi.PushMessageResponse
    if (replyToken) {
      await client.setState({
        id: conversation.id,
        name: 'conversation',
        type: 'conversation',
        payload: { replyToken: undefined },
      })
      lineResponse = await lineClient.replyMessage({
        replyToken,
        messages: [message],
      })
    } else {
      const usrId = conversation.tags.usrId
      if (!usrId) {
        throw new RuntimeError('No user id found in conversation tags')
      }
      lineResponse = await lineClient.pushMessage({
        to: usrId,
        messages: [message],
      })
    }

    const sentMessage = lineResponse.sentMessages[0]
    if (sentMessage) {
      await ack({ tags: { msgId: sentMessage.id } })
    }
  } catch (e: any) {
    console.error(`Error: ${e}`)
  }
}

const integration = new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    startTypingIndicator: async ({ client, ctx, input }) => {
      const config = {
        channelAccessToken: ctx.configuration.channelAccessToken,
      }
      const lineClient = new lineMessagingApi.MessagingApiClient(config)
      const { conversationId, timeout } = input
      const { conversation } = await client.getConversation({ id: conversationId })
      const lineUserId = conversation.tags.usrId
      if (!lineUserId) {
        throw new RuntimeError('No user id found in conversation tags')
      }
      const timeoutSeconds = Math.ceil((timeout ?? DEFAULT_TIMEOUT_MS) / 1000)
      const loadingSeconds = Math.min(
        Math.ceil(timeoutSeconds / LOADING_TIMEOUT_MULTIPLE) * LOADING_TIMEOUT_MULTIPLE,
        MAX_TIMEOUT_SECONDS
      )
      await lineClient.showLoadingAnimation({
        chatId: lineUserId,
        loadingSeconds,
      })
      return {}
    },
    stopTypingIndicator: async () => ({}),
  },
  channels: {
    channel: {
      messages: {
        text: async ({ payload, ctx, conversation, ack, client }) => {
          await replyOrSendLineMessage(
            { ctx, conversation, client, ack },
            {
              type: 'text',
              text: payload.text,
            }
          )
        },
        image: async ({ payload, ctx, conversation, ack, client }) => {
          await replyOrSendLineMessage(
            { ctx, conversation, client, ack },
            {
              type: 'image',
              originalContentUrl: payload.imageUrl,
              previewImageUrl: payload.imageUrl, // Can use this - later when the upload is ready: https://www.npmjs.com/package/image-thumbnail
            }
          )
        },
        markdown: async ({ payload, ctx, conversation, ack, client }) => {
          await replyOrSendLineMessage(
            { ctx, conversation, client, ack },
            {
              type: 'text',
              text: payload.markdown,
            }
          )
        },
        // TODO: fix audio, its not working
        audio: async ({ payload, ctx, conversation, ack, client }) => {
          await replyOrSendLineMessage(
            { ctx, conversation, client, ack },
            {
              type: 'audio',
              originalContentUrl: payload.audioUrl,
              duration: -1,
            }
          )
        },
        video: async ({ payload, ctx, conversation, ack, client }) => {
          //TODO: Upload the thumbnail so it is ready to be passed as URL to Line
          await replyOrSendLineMessage(
            { ctx, conversation, client, ack },
            {
              type: 'video',
              originalContentUrl: payload.videoUrl,
              previewImageUrl: 'https://example.com/preview.jpg',
            }
          )
        },
        file: async () => {
          console.error(
            'Documents & files are not supported by Line - https://developers.line.biz/en/reference/messaging-api'
          )
        },
        location: async ({ payload, ctx, conversation, ack, client }) => {
          await replyOrSendLineMessage(
            { ctx, conversation, client, ack },
            {
              type: 'location',
              title: payload.title ?? '',
              latitude: payload.latitude,
              longitude: payload.longitude,
              address: payload.address ?? '',
            }
          )
        },
        carousel: async ({ payload, ctx, conversation, ack, client }) => {
          const sections: lineMessagingApi.FlexBubble[] = []
          for (let indexS = 0; indexS < payload.items.length; indexS++) {
            const item = payload.items[indexS]
            if (!item) {
              continue //just to pass the build validation
            }

            const buttons: lineMessagingApi.FlexButton[] = []
            for (let indexR = 0; indexR < item.actions.length; indexR++) {
              const action = item.actions[indexR]

              if (!action) {
                continue //just to pass the build validation
              }

              if (action.action === 'postback') {
                buttons.push({
                  type: 'button',
                  action: {
                    type: 'message',
                    label: action.label.substring(0, 40),
                    text: action.value.substring(0, 300),
                  },
                })
              } else {
                buttons.push({
                  type: 'button',
                  action: {
                    type: 'uri',
                    label: action.label.substring(0, 40),
                    uri: action.value.substring(0, 1000),
                  },
                })
              }
            }

            sections.push({
              type: 'bubble',
              body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'image',
                    url: item.imageUrl ?? '',
                  },
                  {
                    type: 'separator',
                  },
                  {
                    type: 'text',
                    text: item.title,
                  },
                  {
                    type: 'text',
                    text: item.subtitle ?? '',
                  },
                  {
                    type: 'separator',
                  },
                  ...buttons,
                ],
              },
            })

            if (sections.length === 12) {
              console.warn(
                'Only 12 items are allowed - https://developers.line.biz/en/reference/messaging-api/#f-carousel'
              )
              break
            }
          }

          await replyOrSendLineMessage(
            { ctx, conversation, client, ack },
            {
              type: 'flex',
              altText: 'this is a flex message',
              contents: {
                type: 'carousel',
                contents: sections,
              },
            }
          )
        },
        card: async ({ payload, ctx, conversation, ack, client }) => {
          const buttons: lineMessagingApi.FlexButton[] = []
          for (let index = 0; index < payload.actions.length; index++) {
            const action = payload.actions[index]

            if (!action) {
              continue
            }

            if (action.action === 'postback') {
              buttons.push({
                type: 'button', // Add generic styles to the buttons: https://developers.line.biz/en/reference/messaging-api/#button
                action: {
                  type: 'message',
                  label: action.label.substring(0, 40),
                  text: action.value.substring(0, 300),
                },
              })
            } else {
              buttons.push({
                type: 'button',
                action: {
                  type: 'uri',
                  label: action.label.substring(0, 40),
                  uri: action.value.substring(0, 1000),
                },
              })
            }
          }

          await replyOrSendLineMessage(
            { ctx, conversation, client, ack },
            {
              type: 'flex',
              altText: payload.title,
              contents: {
                type: 'bubble',
                body: {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'image',
                      url: payload.imageUrl ?? '',
                    },
                    {
                      type: 'separator',
                    },
                    {
                      type: 'text',
                      text: payload.title,
                    },
                    {
                      type: 'text',
                      text: payload.subtitle ?? '',
                    },
                    {
                      type: 'separator',
                    },
                    ...buttons,
                  ],
                },
              },
            }
          )
        },
        dropdown: async ({ payload, ctx, conversation, ack, client }) => {
          const buttons: lineMessagingApi.FlexButton[] = []
          for (let index = 0; index < payload.options.length; index++) {
            const choice = payload.options[index]

            if (!choice) {
              continue
            }

            buttons.push({
              type: 'button', // Add generic styles to the buttons: https://developers.line.biz/en/reference/messaging-api/#button
              action: {
                type: 'message',
                label: choice.label.substring(0, 40),
                text: choice.value.substring(0, 300),
              },
            })
          }

          await replyOrSendLineMessage(
            { ctx, conversation, client, ack },
            {
              type: 'flex',
              altText: payload.text,
              contents: {
                type: 'bubble',
                body: {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'text',
                      text: payload.text,
                    },
                    {
                      type: 'text',
                      text: payload.text,
                    },
                    {
                      type: 'separator',
                    },
                    ...buttons,
                  ],
                },
              },
            }
          )
        },
        choice: async ({ payload, ctx, conversation, ack, client }) => {
          const buttons: lineMessagingApi.FlexButton[] = []
          for (let index = 0; index < payload.options.length; index++) {
            const choice = payload.options[index]
            if (!choice) {
              continue
            }

            buttons.push({
              type: 'button', // Add generic styles to the buttons: https://developers.line.biz/en/reference/messaging-api/#button
              action: {
                type: 'message',
                label: choice.label.substring(0, 40),
                text: choice.value.substring(0, 300),
              },
            })
          }

          const contents: lineMessagingApi.FlexBubble = {
            type: 'bubble',
            body: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: payload.text,
                },
                {
                  type: 'separator',
                },
                ...buttons,
              ],
            },
          }

          await replyOrSendLineMessage({ ctx, conversation, client, ack }, {
            type: 'flex',
            altText: payload.text,
            contents,
          } satisfies lineMessagingApi.FlexMessage)
        },
        bloc: () => {
          throw new RuntimeError('Not implemented')
        },
      },
    },
  },
  handler: async ({ req, client, ctx }) => {
    console.info('Handler received request')

    if (!req.body) {
      throw new Error('Handler received an empty body')
    }

    if (req.body && JSON.parse(req.body).events.length === 0) {
      return {
        status: 200,
      }
    }

    if (!req.body) {
      console.warn('Handler received an empty body')
      return
    }

    const channelSecret = ctx.configuration.channelSecret // Channel secret string
    const body = req.body // Request body string
    const signature = crypto.createHmac('SHA256', channelSecret).update(body).digest('base64')
    // Compare x-line-signature request header and the signature

    if (req.headers['x-line-signature'] !== signature) {
      console.warn('Wrong Signature')
      return {
        status: 401,
      }
    }

    const data = JSON.parse(req.body) as LinePayload

    for (const event of data.events) {
      if (event.type === 'message') {
        await handleMessage(event, data.destination, client)
      }
    }

    return
  },
  createUser: async ({ client, tags, ctx }) => {
    const userId = tags.usrId
    if (!userId) {
      return
    }

    const lineClient = new lineMessagingApi.MessagingApiClient({
      channelAccessToken: ctx.configuration.channelAccessToken,
    })
    const profile = await lineClient.getProfile(userId)

    const { user } = await client.getOrCreateUser({ tags: { usrId: `${profile.userId}` } })

    return {
      body: JSON.stringify({ user: { id: user.id } }),
      headers: {},
      statusCode: 200,
    }
  },
  createConversation: async ({ client, channel, tags, ctx }) => {
    const usrId = tags.usrId
    const destId = tags.destId
    if (!(usrId && destId)) {
      return
    }

    const lineClient = new lineMessagingApi.MessagingApiClient({
      channelAccessToken: ctx.configuration.channelAccessToken,
    })
    const profile = await lineClient.getProfile(usrId)

    const { conversation } = await client.getOrCreateConversation({
      channel,
      tags: { usrId: `${profile.userId}`, destId },
    })

    return {
      body: JSON.stringify({ conversation: { id: conversation.id } }),
      headers: {},
      statusCode: 200,
    }
  },
})

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})

async function handleMessage(events: LineEvents, destination: string, client: bp.Client) {
  const message = events.message
  if (message.type) {
    const { conversation } = await client.getOrCreateConversation({
      channel: 'channel',
      tags: {
        usrId: events.source.userId,
        destId: destination,
      },
    })

    await client.setState({
      id: conversation.id,
      name: 'conversation',
      type: 'conversation',
      payload: { replyToken: events.replyToken },
    })

    const { user } = await client.getOrCreateUser({
      tags: {
        usrId: events.source.userId,
      },
    })

    if (message.type === 'text') {
      await client.createMessage({
        tags: { msgId: message.id },
        type: 'text',
        userId: user.id,
        conversationId: conversation.id,
        payload: { text: message.text },
      })
    }
  }
}

type LinePayload = {
  destination: string
  events: LineEvents[]
}

type LineEvents = {
  type: string
  webhookEventId: string
  timestamp: string
  replyToken: string
  mode: string
  deliveryContext: {
    isRedelivery: boolean
  }
  source: LineSource
  message: LineMessage
}

type LineSource = {
  type: string
  userId: string
}

type LineMessage = {
  type: string
  id: string
  text: string
}
