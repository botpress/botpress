import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import * as line from '@line/bot-sdk'
import crypto from 'crypto'
import { Integration, secrets, Client } from '.botpress'

type Channels = Integration['channels']
type Messages = Channels[keyof Channels]['messages']
type MessageHandler = Messages[keyof Messages]
type MessageHandlerProps = Parameters<MessageHandler>[0]

type ReplyLineProps = Pick<MessageHandlerProps, 'ctx' | 'conversation' | 'client' | 'ack'>

sentryHelpers.init({
  dsn: secrets.SENTRY_DSN,
  environment: secrets.SENTRY_ENVIRONMENT,
  release: secrets.SENTRY_RELEASE,
})

const log = console
log.info('starting integration line')

const replyLineMessage = async (props: ReplyLineProps, messageObj: line.Message) => {
  const { ctx, conversation, client, ack } = props
  const config = {
    channelAccessToken: ctx.configuration.channelAccessToken,
    channelSecret: ctx.configuration.channelSecret,
  }

  const lineClient = new line.Client(config)

  const stateRes = await client.getState({
    id: conversation.id,
    name: 'conversation',
    type: 'conversation',
  })

  try {
    const lineResponse = await lineClient.replyMessage(stateRes.state.payload.replyToken, messageObj)

    if (lineResponse?.['x-line-request-id']) {
      await ack({ tags: { ['line:msgId']: lineResponse['x-line-request-id'] } })
    }
  } catch (e: any) {
    log.error(`Error: ${e.originalError.message}`)
  }
}

const integration = new Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {},
  channels: {
    channel: {
      messages: {
        text: async ({ payload, ctx, conversation, ack, client }) => {
          await replyLineMessage(
            { ctx, conversation, client, ack },
            {
              type: 'text',
              text: payload.text,
            }
          )
        },
        image: async ({ payload, ctx, conversation, ack, client }) => {
          await replyLineMessage(
            { ctx, conversation, client, ack },
            {
              type: 'image',
              originalContentUrl: payload.imageUrl,
              previewImageUrl: payload.imageUrl, // Can use this - later when the upload is ready: https://www.npmjs.com/package/image-thumbnail
            }
          )
        },
        markdown: async ({ payload, ctx, conversation, ack, client }) => {
          await replyLineMessage(
            { ctx, conversation, client, ack },
            {
              type: 'text',
              text: payload.markdown,
            }
          )
        },

        // TODO: fix audio, its not working
        audio: async ({ payload, ctx, conversation, ack, client }) => {
          await replyLineMessage(
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

          await replyLineMessage(
            { ctx, conversation, client, ack },
            {
              type: 'video',
              originalContentUrl: payload.videoUrl,
              previewImageUrl: 'https://example.com/preview.jpg',
            }
          )
        },
        file: async () => {
          log.error(
            'Documents & files are not supported by Line - https://developers.line.biz/en/reference/messaging-api'
          )
        },

        // TODO: fix location, its not working
        location: async ({ payload, ctx, conversation, ack, client }) => {
          await replyLineMessage(
            { ctx, conversation, client, ack },
            {
              type: 'location',
              title: '', // TODO: fix this
              latitude: payload.latitude,
              longitude: payload.longitude,
              address: '', // TODO: fix this
            }
          )
        },
        carousel: async ({ payload, ctx, conversation, ack, client }) => {
          const sections: line.FlexBubble[] = []
          for (let indexS = 0; indexS < payload.items.length; indexS++) {
            const item = payload.items[indexS]
            if (!item) {
              continue //just to pass the build validation
            }

            const buttons: line.FlexButton[] = []
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
              log.warn('Only 12 items are allowed - https://developers.line.biz/en/reference/messaging-api/#f-carousel')
              break
            }
          }

          await replyLineMessage(
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
          const buttons: line.FlexButton[] = []
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

          await replyLineMessage(
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
          const buttons: line.FlexButton[] = []
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

          await replyLineMessage(
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
          const buttons: line.FlexButton[] = []
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

          const contents: line.FlexBubble = {
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

          await replyLineMessage({ ctx, conversation, client, ack }, {
            type: 'flex',
            altText: payload.text,
            contents,
          } satisfies line.FlexMessage)
        },
      },
    },
  },
  handler: async ({ req, client, ctx }) => {
    log.info('Handler received request')

    if (!req.body) {
      throw new Error('Handler received an empty body')
    }

    if (req.body && JSON.parse(req.body).events.length === 0) {
      return {
        status: 200,
      }
    }

    if (!req.body) {
      log.warn('Handler received an empty body')
      return
    }

    const channelSecret = ctx.configuration.channelSecret // Channel secret string
    const body = req.body // Request body string
    const signature = crypto.createHmac('SHA256', channelSecret).update(body).digest('base64')
    // Compare x-line-signature request header and the signature

    if (req.headers['x-line-signature'] !== signature) {
      log.warn('Wrong Signature')
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
    const userId = tags['line:usrId']

    if (!userId) {
      return
    }

    const lineClient = new line.Client({
      channelAccessToken: ctx.configuration.channelAccessToken,
      channelSecret: ctx.configuration.channelSecret,
    })
    const profile = await lineClient.getProfile(userId)

    const { user } = await client.getOrCreateUser({ tags: { 'line:usrId': `${profile.userId}` } })

    return {
      body: JSON.stringify({ user: { id: user.id } }),
      headers: {},
      statusCode: 200,
    }
  },
  createConversation: async ({ client, channel, tags, ctx }) => {
    const usrId = tags['line:usrId']
    const destId = tags['line:destId']

    if (!(usrId && destId)) {
      return
    }

    const lineClient = new line.Client({
      channelAccessToken: ctx.configuration.channelAccessToken,
      channelSecret: ctx.configuration.channelSecret,
    })
    const profile = await lineClient.getProfile(usrId)

    const { conversation } = await client.getOrCreateConversation({
      channel,
      tags: { 'line:usrId': `${profile.userId}`, 'line:destId': destId },
    })

    return {
      body: JSON.stringify({ conversation: { id: conversation.id } }),
      headers: {},
      statusCode: 200,
    }
  },
})

export default sentryHelpers.wrapIntegration(integration)

async function handleMessage(events: LineEvents, destination: string, client: Client) {
  const message = events.message
  if (message.type) {
    const { conversation } = await client.getOrCreateConversation({
      channel: 'channel',
      tags: {
        ['line:usrId']: events.source.userId,
        ['line:destId']: destination,
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
        ['line:usrId']: events.source.userId,
      },
    })

    if (message.type === 'text') {
      await client.createMessage({
        tags: { ['line:msgId']: message.id },
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
