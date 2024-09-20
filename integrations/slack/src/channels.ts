import { RuntimeError } from '@botpress/client'
import { textSchema } from './definitions/schemas'
import { renderCard } from './misc/renderer'
import { Channels } from './misc/types'
import { getSlackTarget, notEmpty, sendSlackMessage } from './misc/utils'

const defaultMessages = {
  text: async ({ client, payload, ctx, conversation, ack, logger }) => {
    const parsed = textSchema.parse(payload)
    logger.forBot().debug('Sending text message to Slack chat:', payload)
    await sendSlackMessage(
      { ack, ctx, client, logger },
      {
        ...getSlackTarget(conversation),
        ...parsed,
      }
    )
  },
  image: async ({ client, payload, ctx, conversation, ack, logger }) => {
    logger.forBot().debug('Sending image message to Slack chat:', payload)
    await sendSlackMessage(
      { ack, ctx, client, logger },
      {
        ...getSlackTarget(conversation),
        blocks: [
          {
            type: 'image',
            image_url: payload.imageUrl,
            alt_text: 'image',
          },
        ],
      }
    )
  },
  markdown: async ({ ctx, conversation, ack, client, payload, logger }) => {
    logger.forBot().debug('Sending markdown message to Slack chat:', payload)

    await sendSlackMessage(
      { ack, ctx, client, logger },
      {
        ...getSlackTarget(conversation),
        text: payload.markdown,
        blocks: [
          {
            type: 'section',
            text: { type: 'mrkdwn', text: payload.markdown },
          },
        ],
      }
    )
  },
  audio: async ({ ctx, conversation, ack, client, payload, logger }) => {
    logger.forBot().debug('Sending audio message to Slack chat:', payload)
    await sendSlackMessage(
      { ack, ctx, client, logger },
      {
        ...getSlackTarget(conversation),
        text: 'audio',
        blocks: [
          {
            type: 'section',
            text: { type: 'mrkdwn', text: `<${payload.audioUrl}|audio>` },
          },
        ],
      }
    )
  },
  video: async ({ ctx, conversation, ack, client, payload, logger }) => {
    logger.forBot().debug('Sending video message to Slack chat:', payload)
    await sendSlackMessage(
      { ack, ctx, client, logger },
      {
        ...getSlackTarget(conversation),
        text: 'video',
        blocks: [
          {
            type: 'section',
            text: { type: 'mrkdwn', text: `<${payload.videoUrl}|video>` },
          },
        ],
      }
    )
  },
  file: async ({ ctx, conversation, ack, client, payload, logger }) => {
    logger.forBot().debug('Sending file message to Slack chat:', payload)
    await sendSlackMessage(
      { ack, ctx, client, logger },
      {
        ...getSlackTarget(conversation),
        text: 'file',
        blocks: [
          {
            type: 'section',
            text: { type: 'mrkdwn', text: `<${payload.fileUrl}|file>` },
          },
        ],
      }
    )
  },
  location: async ({ ctx, conversation, ack, client, payload, logger }) => {
    const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${payload.latitude},${payload.longitude}`
    logger.forBot().debug('Sending location message to Slack chat:', payload)
    await sendSlackMessage(
      { ack, ctx, client, logger },
      {
        ...getSlackTarget(conversation),
        text: 'location',
        blocks: [
          {
            type: 'section',
            text: { type: 'mrkdwn', text: `<${googleMapsLink}|location>` },
          },
        ],
      }
    )
  },
  carousel: async ({ ctx, conversation, ack, client, payload, logger }) => {
    logger.forBot().debug('Sending carousel message to Slack chat:', payload)
    await sendSlackMessage(
      { ack, ctx, client, logger },
      {
        ...getSlackTarget(conversation),
        text: 'carousel',
        blocks: payload.items.flatMap(renderCard).filter(notEmpty),
      }
    )
  },
  card: async ({ ctx, conversation, ack, client, payload, logger }) => {
    logger.forBot().debug('Sending card message to Slack chat:', payload)
    await sendSlackMessage(
      { ack, ctx, client, logger },
      {
        ...getSlackTarget(conversation),
        text: 'card',
        blocks: renderCard(payload),
      }
    )
  },
  dropdown: async ({ ctx, conversation, ack, client, payload, logger }) => {
    logger.forBot().debug('Sending dropdown message to Slack chat:', payload)
    await sendSlackMessage(
      { ack, ctx, client, logger },
      {
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
      }
    )
  },
  choice: async ({ ctx, conversation, ack, client, payload, logger }) => {
    logger.forBot().debug('Sending choice message to Slack chat:', payload)
    await sendSlackMessage(
      { ack, ctx, client, logger },
      {
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
      }
    )
  },
  bloc: () => {
    throw new RuntimeError('Not implemented')
  },
} satisfies Channels['channel']['messages'] & Channels['dm']['messages'] & Channels['thread']['messages']

export default {
  channel: { messages: defaultMessages },
  dm: { messages: defaultMessages },
  thread: { messages: defaultMessages },
} satisfies Channels
