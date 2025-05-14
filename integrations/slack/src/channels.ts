import { RuntimeError } from '@botpress/client'
import { ChatPostMessageArguments } from '@slack/web-api'
import { textSchema } from '../definitions/channels/text-input-schema'
import { isValidUrl } from './misc/utils'
import { SlackClient } from './slack-api'
import { renderCard } from './slack-api/card-renderer'
import * as bp from '.botpress'

const defaultMessages = {
  text: async ({ client, payload, ctx, conversation, ack, logger }) => {
    const parsed = textSchema.parse(payload)
    logger.forBot().debug('Sending text message to Slack chat:', payload)
    await _sendSlackMessage(
      { ack, ctx, client, logger },
      {
        ..._getSlackTarget(conversation),
        ...parsed,
      }
    )
  },
  image: async ({ client, payload, ctx, conversation, ack, logger }) => {
    logger.forBot().debug('Sending image message to Slack chat:', payload)
    await _sendSlackMessage(
      { ack, ctx, client, logger },
      {
        ..._getSlackTarget(conversation),
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
  audio: async ({ ctx, conversation, ack, client, payload, logger }) => {
    logger.forBot().debug('Sending audio message to Slack chat:', payload)
    await _sendSlackMessage(
      { ack, ctx, client, logger },
      {
        ..._getSlackTarget(conversation),
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
    await _sendSlackMessage(
      { ack, ctx, client, logger },
      {
        ..._getSlackTarget(conversation),
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
    await _sendSlackMessage(
      { ack, ctx, client, logger },
      {
        ..._getSlackTarget(conversation),
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
    await _sendSlackMessage(
      { ack, ctx, client, logger },
      {
        ..._getSlackTarget(conversation),
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
    await _sendSlackMessage(
      { ack, ctx, client, logger },
      {
        ..._getSlackTarget(conversation),
        text: 'carousel',
        blocks: payload.items.flatMap(renderCard).filter((value) => !!value),
      }
    )
  },
  card: async ({ ctx, conversation, ack, client, payload, logger }) => {
    logger.forBot().debug('Sending card message to Slack chat:', payload)
    await _sendSlackMessage(
      { ack, ctx, client, logger },
      {
        ..._getSlackTarget(conversation),
        text: 'card',
        blocks: renderCard(payload),
      }
    )
  },
  dropdown: async ({ ctx, conversation, ack, client, payload, logger }) => {
    logger.forBot().debug('Sending dropdown message to Slack chat:', payload)
    await _sendSlackMessage(
      { ack, ctx, client, logger },
      {
        ..._getSlackTarget(conversation),
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
    await _sendSlackMessage(
      { ack, ctx, client, logger },
      {
        ..._getSlackTarget(conversation),
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
} satisfies bp.IntegrationProps['channels']['channel']['messages'] &
  bp.IntegrationProps['channels']['dm']['messages'] &
  bp.IntegrationProps['channels']['thread']['messages']

const _getSlackTarget = (conversation: bp.ClientResponses['getConversation']['conversation']) => {
  const channel = conversation.tags.id
  const thread = (conversation.tags as Record<string, string>).thread // TODO: fix cast in SDK typings

  if (!channel) {
    throw Error(`No channel found for conversation ${conversation.id}`)
  }

  return { channel, thread_ts: thread }
}

const _getOptionalProps = (ctx: bp.Context, logger: bp.Logger) => {
  const props = {
    username: ctx.configuration.botName?.trim(),
    icon_url: undefined as string | undefined,
  }

  if (ctx.configuration.botAvatarUrl) {
    if (isValidUrl(ctx.configuration.botAvatarUrl)) {
      props.icon_url = ctx.configuration.botAvatarUrl
    } else {
      logger.forBot().warn('Invalid bot avatar URL')
    }
  }

  return props
}

const _sendSlackMessage = async (
  { client, ctx, ack, logger }: { client: bp.Client; ctx: bp.Context; ack: bp.AnyAckFunction; logger: bp.Logger },
  payload: ChatPostMessageArguments
) => {
  const slackClient = await SlackClient.createFromStates({ client, ctx, logger })

  const botOptionalProps = _getOptionalProps(ctx, logger)

  const message = await slackClient.postMessage({
    channelId: payload.channel,
    threadTs: payload.thread_ts,
    text: payload.text,
    blocks: payload.blocks,
    username: botOptionalProps.username,
    iconUrl: botOptionalProps.icon_url,
  })

  if (!message) {
    throw Error('Error sending message')
  }

  await ack({ tags: { ts: message.ts, channelId: payload.channel, userId: message?.user } })

  return message
}

export default {
  channel: { messages: defaultMessages },
  dm: { messages: defaultMessages },
  thread: { messages: defaultMessages },
} satisfies bp.IntegrationProps['channels']
