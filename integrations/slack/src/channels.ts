import { RuntimeError } from '@botpress/client'
import { Block, KnownBlock } from '@slack/web-api'
import { textSchema } from '../definitions/channels/text-input-schema'
import { ChannelOrigin, channelOriginSchema, ReplyLocation, replyLocationSchema } from '../definitions/configuration'
import { transformMarkdownForSlack } from './misc/markdown-to-slack'
import { replaceMentions } from './misc/replace-mentions'
import { isValidUrl } from './misc/utils'
import { SlackClient } from './slack-api'
import { renderCard } from './slack-api/card-renderer'
import * as bp from '.botpress'

const defaultMessages = {
  text: async ({ client, payload, ctx, conversation, ack, logger }) => {
    const parsed = textSchema.parse(payload)
    let transformedText = replaceMentions(parsed.text, parsed.mentions)
    transformedText = transformMarkdownForSlack(transformedText)
    parsed.text = transformedText
    logger.forBot().debug('Sending text message to Slack chat:', payload)
    await _sendSlackMessage({ ack, ctx, client, logger, conversation }, parsed)
  },
  image: async ({ client, payload, ctx, conversation, ack, logger }) => {
    logger.forBot().debug('Sending image message to Slack chat:', payload)
    await _sendSlackMessage(
      { ack, ctx, client, logger, conversation },
      {
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
      { ack, ctx, client, logger, conversation },
      {
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
      { ack, ctx, client, logger, conversation },
      {
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
      { ack, ctx, client, logger, conversation },
      {
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
      { ack, ctx, client, logger, conversation },
      {
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
      { ack, ctx, client, logger, conversation },
      {
        text: 'carousel',
        blocks: payload.items.flatMap(renderCard).filter((value) => !!value),
      }
    )
  },
  card: async ({ ctx, conversation, ack, client, payload, logger }) => {
    logger.forBot().debug('Sending card message to Slack chat:', payload)
    await _sendSlackMessage(
      { ack, ctx, client, logger, conversation },
      {
        text: 'card',
        blocks: renderCard(payload),
      }
    )
  },
  dropdown: async ({ ctx, conversation, ack, client, payload, logger }) => {
    logger.forBot().debug('Sending dropdown message to Slack chat:', payload)
    await _sendSlackMessage(
      { ack, ctx, client, logger, conversation },
      {
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
      { ack, ctx, client, logger, conversation },
      {
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

type SlackReplyLocation = { channel: string; thread_ts?: string }

const _resolveReplyLocations = (
  conversation: bp.ClientResponses['getConversation']['conversation'],
  ctx: bp.Context
): SlackReplyLocation[] => {
  const channelOrigin: ChannelOrigin = channelOriginSchema.parse(conversation.tags.channelOrigin)
  const channel = conversation.tags.id
  const existingThread = conversation.tags.thread
  const originalMessageTs = conversation.tags.originalMessageTs

  if (!channel) {
    throw new Error(`No channel found for conversation ${conversation.id}`)
  }

  if (channelOrigin === 'dm') {
    return [{ channel }]
  }

  if (channelOrigin === 'thread' && existingThread) {
    return [{ channel, thread_ts: existingThread }]
  }

  const replyLocation: ReplyLocation = replyLocationSchema.parse(
    conversation.tags.replyLocation ?? ctx.configuration.replyBehaviour?.location ?? 'channel'
  )

  const threadTs = existingThread ?? originalMessageTs

  switch (replyLocation) {
    case 'channel':
      return [{ channel }]
    case 'thread':
      return threadTs ? [{ channel, thread_ts: threadTs }] : [{ channel }]
    case 'channelAndThread':
      return threadTs ? [{ channel }, { channel, thread_ts: threadTs }] : [{ channel }]
  }
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
  {
    client,
    ctx,
    ack,
    logger,
    conversation,
  }: {
    client: bp.Client
    ctx: bp.Context
    ack: bp.AnyAckFunction
    logger: bp.Logger
    conversation: bp.ClientResponses['getConversation']['conversation']
  },
  payload: { text?: string; blocks?: (Block | KnownBlock)[] }
) => {
  const slackClient = await SlackClient.createFromStates({ client, ctx, logger })
  const botOptionalProps = _getOptionalProps(ctx, logger)
  const replyLocations = _resolveReplyLocations(conversation, ctx)

  let firstMessage: Awaited<ReturnType<typeof slackClient.postMessage>> | undefined

  for (const location of replyLocations) {
    const message = await slackClient.postMessage({
      channelId: location.channel,
      threadTs: location.thread_ts,
      text: payload.text,
      blocks: payload.blocks,
      username: botOptionalProps.username,
      iconUrl: botOptionalProps.icon_url,
    })

    if (!message) {
      throw Error('Error sending message')
    }

    // NOTE: When sending to multiple locations (e.g. channel + thread), we only ack the first message
    // to Botpress and use it to track the thread for future replies
    if (!firstMessage) {
      firstMessage = message

      // NOTE: Store thread_ts so subsequent messages in this conversation reply to the same thread
      if (location.thread_ts && !conversation.tags.thread) {
        await client.updateConversation({
          id: conversation.id,
          tags: { thread: location.thread_ts },
        })
      }
    }
  }

  if (!firstMessage) {
    throw Error('No message was sent')
  }

  await ack({ tags: { ts: firstMessage.ts, channelId: replyLocations[0]!.channel, userId: firstMessage.user } })

  return firstMessage
}

export default {
  channel: { messages: defaultMessages },
  dm: { messages: defaultMessages },
  thread: { messages: defaultMessages },
} satisfies bp.IntegrationProps['channels']
