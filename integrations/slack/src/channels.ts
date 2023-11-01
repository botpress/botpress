import { textSchema } from './definitions/schemas'
import { renderCard } from './misc/renderer'
import { Channels } from './misc/types'
import { getAccessToken, getSlackTarget, notEmpty, sendSlackMessage } from './misc/utils'

const defaultMessages: Channels['channel']['messages'] = {
  text: async ({ client, payload, ctx, conversation, ack }) => {
    const parsed = textSchema.parse(payload)
    const accessToken = await getAccessToken(client, ctx)
    await sendSlackMessage(accessToken, ack, {
      ...getSlackTarget(conversation),
      ...parsed,
    })
  },
  image: async ({ client, payload, ctx, conversation, ack }) => {
    const accessToken = await getAccessToken(client, ctx)
    await sendSlackMessage(accessToken, ack, {
      ...getSlackTarget(conversation),
      blocks: [
        {
          type: 'image',
          image_url: payload.imageUrl,
          alt_text: 'image',
        },
      ],
    })
  },
  markdown: async ({ ctx, conversation, ack, client, payload }) => {
    const accessToken = await getAccessToken(client, ctx)
    await sendSlackMessage(accessToken, ack, {
      ...getSlackTarget(conversation),
      text: payload.markdown,
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: payload.markdown },
        },
      ],
    })
  },
  audio: async ({ ctx, conversation, ack, client, payload }) => {
    const accessToken = await getAccessToken(client, ctx)
    await sendSlackMessage(accessToken, ack, {
      ...getSlackTarget(conversation),
      text: 'audio',
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `<${payload.audioUrl}|audio>` },
        },
      ],
    })
  },
  video: async ({ ctx, conversation, ack, client, payload }) => {
    const accessToken = await getAccessToken(client, ctx)
    await sendSlackMessage(accessToken, ack, {
      ...getSlackTarget(conversation),
      text: 'video',
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `<${payload.videoUrl}|video>` },
        },
      ],
    })
  },
  file: async ({ ctx, conversation, ack, client, payload }) => {
    const accessToken = await getAccessToken(client, ctx)
    await sendSlackMessage(accessToken, ack, {
      ...getSlackTarget(conversation),
      text: 'file',
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `<${payload.fileUrl}|file>` },
        },
      ],
    })
  },
  location: async ({ ctx, conversation, ack, client, payload }) => {
    const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${payload.latitude},${payload.longitude}`
    const accessToken = await getAccessToken(client, ctx)
    await sendSlackMessage(accessToken, ack, {
      ...getSlackTarget(conversation),
      text: 'location',
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `<${googleMapsLink}|location>` },
        },
      ],
    })
  },
  carousel: async ({ ctx, conversation, ack, client, payload }) => {
    const accessToken = await getAccessToken(client, ctx)
    await sendSlackMessage(accessToken, ack, {
      ...getSlackTarget(conversation),
      text: 'carousel',
      blocks: payload.items.flatMap(renderCard).filter(notEmpty),
    })
  },
  card: async ({ ctx, conversation, ack, client, payload }) => {
    const accessToken = await getAccessToken(client, ctx)
    await sendSlackMessage(accessToken, ack, {
      ...getSlackTarget(conversation),
      text: 'card',
      blocks: renderCard(payload),
    })
  },
  dropdown: async ({ ctx, conversation, ack, client, payload }) => {
    const accessToken = await getAccessToken(client, ctx)
    await sendSlackMessage(accessToken, ack, {
      ...getSlackTarget(conversation),
      text: payload.text,
      blocks:
        payload.options?.length > 0
          ? [
              {
                type: 'actions',
                elements: [
                  {
                    type: 'static_select',
                    action_id: 'option_selected',
                    placeholder: {
                      type: 'plain_text',
                      text: payload.text,
                    },
                    options: payload.options
                      .filter((o) => o.label.length > 0)
                      .map((choice) => ({
                        text: {
                          type: 'plain_text',
                          text: choice.label,
                        },
                        value: choice.value,
                      })),
                  },
                ],
              },
            ]
          : undefined,
    })
  },
  choice: async ({ ctx, conversation, ack, client, payload }) => {
    const accessToken = await getAccessToken(client, ctx)
    await sendSlackMessage(accessToken, ack, {
      ...getSlackTarget(conversation),
      text: payload.text,
      blocks:
        payload.options?.length > 0
          ? [
              {
                type: 'section',
                text: {
                  type: 'plain_text',
                  text: payload.text,
                },
              },
              {
                type: 'actions',
                elements: payload.options
                  .filter((o) => o.label.length > 0)
                  .map((choice, i) => ({
                    type: 'button',
                    text: { type: 'plain_text', text: choice.label },
                    value: choice.value,
                    action_id: `quick_reply_${i}`,
                  })),
              },
            ]
          : undefined,
    })
  },
}

export default {
  channel: { messages: defaultMessages },
  dm: { messages: defaultMessages },
  thread: { messages: defaultMessages },
} satisfies Channels
