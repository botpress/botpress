import { slackToMarkdown } from '@bpinternal/slackdown'
import { AllMessageEvents, FileShareMessageEvent } from '@slack/types'
import { getBotpressConversationFromSlackThread, getBotpressUserFromSlackUser } from 'src/misc/utils'
import { SlackClient } from 'src/slack-api'
import * as bp from '.botpress'

export const handleEvent = async ({
  slackEvent,
  client,
  ctx,
  logger,
}: {
  slackEvent: AllMessageEvents
  client: bp.Client
  ctx: bp.Context
  logger: bp.Logger
}) => {
  // do not handle notification-type messages such as channel_join, channel_leave, etc:
  if (slackEvent.subtype && slackEvent.subtype !== 'file_share') {
    return
  }

  // Prevent the bot from answering to other Slack bots:
  if (!slackEvent.subtype && slackEvent.bot_id) {
    return
  }

  const { botpressConversation } = await getBotpressConversationFromSlackThread(
    { slackChannelId: slackEvent.channel, slackThreadId: slackEvent.thread_ts },
    client
  )
  const { botpressUser } = await getBotpressUserFromSlackUser({ slackUserId: slackEvent.user }, client)

  if (!botpressUser.pictureUrl || !botpressUser.name) {
    try {
      const slackClient = await SlackClient.createFromStates({ ctx, client, logger })
      const userProfile = await slackClient.getUserProfile({ userId: slackEvent.user })
      const fieldsToUpdate = {
        pictureUrl: userProfile?.image_192,
        name: userProfile?.real_name,
      }
      logger.forBot().debug('Fetched latest Slack user profile: ', fieldsToUpdate)
      if (fieldsToUpdate.pictureUrl || fieldsToUpdate.name) {
        await client.updateUser({ ...botpressUser, ...fieldsToUpdate })
      }
    } catch (error) {
      logger.forBot().error('Error while fetching user profile from Slack:', error)
    }
  }

  logger.forBot().debug('$$$$$$$$$$$$$', '1')
  const mentionsBot = await _isBotMentionedInMessage({ slackEvent, client, ctx })

  logger.forBot().debug('$$$$$$$$$$$$$', '2')
  if (slackEvent.subtype === 'file_share') {
    logger.forBot().debug('$$$$$$$$$$$$$', '21')
    await _getOrCreateMessageFromFiles(mentionsBot, botpressUser.id, botpressConversation.id, {
      slackEvent,
      client,
      logger,
    })
    return
  }

  logger.forBot().debug('$$$$$$$$$$$$$', '3')
  if (!slackEvent.subtype) {
    if (slackEvent.text === undefined || typeof slackEvent.text !== 'string' || !slackEvent.text?.length) {
      logger.forBot().debug('No text was received, so the message was ignored')
      return
    }

    logger.forBot().debug('$$$$$$$$$$$$$', '4')
    await client.getOrCreateMessage({
      type: 'text',
      payload: { text: slackToMarkdown(slackEvent.text) },
      userId: botpressUser.id,
      conversationId: botpressConversation.id,
      tags: {
        ts: slackEvent.ts,
        userId: slackEvent.user,
        channelId: slackEvent.channel,
        mentionsBot: mentionsBot ? 'true' : undefined,
      },
      discriminateByTags: ['ts', 'channelId'],
    })
  }

  const isSentInChannel = !slackEvent.thread_ts
  const isThreadingEnabled = ctx.configuration.createReplyThread?.enabled ?? false
  const threadingRequiresMention = ctx.configuration.createReplyThread?.onlyOnBotMention ?? false

  const shouldForkToReplyThread = isSentInChannel && isThreadingEnabled && (!threadingRequiresMention || mentionsBot)

  if (shouldForkToReplyThread) {
    const { conversation: threadConversation } = await client.getOrCreateConversation({
      channel: 'thread',
      tags: { id: slackEvent.channel, thread: slackEvent.ts, isBotReplyThread: 'true' },
      discriminateByTags: ['id', 'thread'],
    })
    if (slackEvent.subtype === 'file_share') {
      await _getOrCreateMessageFromFiles(mentionsBot, botpressUser.id, botpressConversation.id, {
        slackEvent,
        client,
        logger,
      })
    } else {
      if (slackEvent.text === undefined || typeof slackEvent.text !== 'string' || !slackEvent.text?.length) {
        logger.forBot().debug('No text was received, so the message was ignored')
        return
      }
      await client.getOrCreateMessage({
        type: 'text',
        payload: { text: slackToMarkdown(slackEvent.text) },
        userId: botpressUser.id,
        conversationId: threadConversation.id,
        tags: {
          ts: slackEvent.ts,
          userId: slackEvent.user,
          channelId: slackEvent.channel,
          mentionsBot: mentionsBot ? 'true' : undefined,
          forkedToThread: 'true',
        },
        discriminateByTags: ['ts', 'channelId', 'forkedToThread'],
      })
    }
  }
}

const _isBotMentionedInMessage = async ({
  slackEvent,
  client,
  ctx,
}: {
  slackEvent: AllMessageEvents
  client: bp.Client
  ctx: bp.Context
}) => {
  if (slackEvent.subtype || !slackEvent.text) {
    return false
  }

  const slackBotId = await _getSlackBotIdFromStates(client, ctx)

  if (!slackBotId) {
    return false
  }

  return (
    slackEvent.text.includes(`<@${slackBotId}>`) ||
    (slackEvent.blocks?.some(
      (block) =>
        'elements' in block &&
        block.elements.some(
          (element) =>
            'elements' in element &&
            element.elements.some((subElement) => subElement.type === 'user' && subElement.user_id === slackBotId)
        )
    ) ??
      false)
  )
}

const _getSlackBotIdFromStates = async (client: bp.Client, ctx: bp.Context) => {
  try {
    const { state } = await client.getState({
      type: 'integration',
      name: 'oAuthCredentialsV2',
      id: ctx.integrationId,
    })
    return state.payload.botUserId
  } catch {}
  return
}

const _getOrCreateMessageFromFiles = async (
  mentionsBot: boolean,
  userId: string,
  conversationId: string,
  {
    slackEvent,
    client,
    logger,
  }: {
    slackEvent: FileShareMessageEvent
    client: bp.Client
    logger: bp.Logger
  }
) => {
  if (!slackEvent.files) {
    return
  }

  if (slackEvent.files.length === 1) {
    const file = slackEvent.files[0]
    if (!file) {
      return
    }

    type MsgTypes = (typeof msgTypes)[number]
    const msgTypes = ['text', 'image', 'audio', 'file'] as const // TODO use zod or botpress sdk
    const isMsgType = (t: string): t is MsgTypes => msgTypes.includes(t as MsgTypes)

    const fileType = file.mimetype.split('/')[0]
    if (!fileType || !isMsgType(fileType)) {
      logger.forBot().info('File of type', fileType, 'is not yet supported.')
      return
    }

    const tags = {
      ts: slackEvent.ts,
      userId: slackEvent.user,
      channelId: slackEvent.channel,
      mentionsBot: mentionsBot ? 'true' : undefined,
    }
    const baseItems = { tags, userId, conversationId }

    switch (fileType) {
      case 'text':
        await client.getOrCreateMessage({
          ...baseItems,
          discriminateByTags: ['ts', 'channelId'],
          type: fileType,
          payload: {
            text: slackEvent.text ? slackToMarkdown(slackEvent.text) : '', // past behavior was not to send the message
          },
        })
        break
      case 'image':
        await client.getOrCreateMessage({
          ...baseItems,
          type: fileType,
          payload: {
            imageUrl: file.permalink_public!,
          },
        })
        break
      case 'audio':
        await client.getOrCreateMessage({
          ...baseItems,
          type: fileType,
          payload: {
            audioUrl: file.permalink_public!,
          },
        })
        break
      case 'file':
        await client.getOrCreateMessage({
          ...baseItems,
          type: fileType,
          payload: {
            fileUrl: file.permalink_public!,
          },
        })
        break
      default:
        logger.forBot().info('File of type', fileType, 'is not yet supported.')
        break
    }
  }

  if (slackEvent.files.length > 1) {
    const items = []
    for (const file of slackEvent.files) {
      type MsgTypes = (typeof msgTypes)[number]
      const msgTypes = ['text', 'image', 'audio', 'file'] as const // TODO use zod or botpress sdk
      const isMsgType = (t: string): t is MsgTypes => msgTypes.includes(t as MsgTypes)

      const fileType = file.mimetype.split('/')[0]
      if (!fileType || !isMsgType(fileType)) {
        logger.forBot().info('File of type', fileType, 'is not yet supported.')
        continue
      }
      switch (fileType) {
        case 'text':
          items.push({ type: fileType, payload: { text: slackEvent.text ? slackToMarkdown(slackEvent.text) : '' } })
          break
        case 'image':
          items.push({ type: fileType, payload: { imageUrl: file.permalink_public! } })
          break
        case 'audio':
          items.push({ type: fileType, payload: { audioUrl: file.permalink_public! } })
          break
        case 'file':
          items.push({ type: fileType, payload: { fileUrl: file.permalink_public! } })
          break
        default:
          logger.forBot().info('File of type', fileType, 'is not yet supported.')
          break
      }
      const tags = {
        ts: slackEvent.ts,
        userId: slackEvent.user,
        channelId: slackEvent.channel,
        mentionsBot: mentionsBot ? 'true' : undefined,
      }
      const baseItems = { tags, userId, conversationId }
      await client.getOrCreateMessage({ ...baseItems, type: 'bloc', payload: { items } })
    }
  }
}
