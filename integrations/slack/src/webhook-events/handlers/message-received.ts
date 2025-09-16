import { slackToMarkdown } from '@bpinternal/slackdown'
import { AllMessageEvents, FileShareMessageEvent, GenericMessageEvent } from '@slack/types'
import { getBotpressConversationFromSlackThread, getBotpressUserFromSlackUser } from 'src/misc/utils'
import { SlackClient } from 'src/slack-api'
import * as bp from '.botpress'

type BlocItem = bp.channels.channel.bloc.Bloc['items'][number]
type MessageTag = keyof bp.ClientRequests['getOrCreateMessage']['tags']

export type HandlerEventProps = {
  slackEvent: AllMessageEvents
  client: bp.Client
  ctx: bp.Context
  logger: bp.Logger
}

export const handleEvent = async (props: HandlerEventProps) => {
  const { slackEvent, client, ctx, logger } = props

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

  const mentionsBot = await _isBotMentionedInMessage({ slackEvent, client, ctx })

  if (slackEvent.subtype === 'file_share') {
    await _getOrCreateMessageFromFiles({
      ctx,
      mentionsBot,
      shouldForkToThread: false,
      conversationId: botpressConversation.id,
      userId: botpressUser.id,
      slackEvent,
      client,
      logger,
    })
  }

  if (!slackEvent.subtype) {
    const text = _parseSlackEventText(slackEvent)
    if (!text) {
      logger.forBot().debug('No text was received, so the message was ignored')
      return
    }

    await client.getOrCreateMessage({
      type: 'text',
      payload: { text: slackToMarkdown(text) },
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
      await _getOrCreateMessageFromFiles({
        ctx,
        mentionsBot,
        shouldForkToThread: shouldForkToReplyThread,
        conversationId: threadConversation.id,
        userId: botpressUser.id,
        slackEvent,
        client,
        logger,
      })
    } else {
      const text = _parseSlackEventText(slackEvent)
      if (!text) {
        logger.forBot().debug('No text was received, so the message was ignored')
        return
      }

      await client.getOrCreateMessage({
        type: 'text',
        payload: { text: slackToMarkdown(text) },
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

type _GetOrCreateMessageFromFilesArgs = {
  mentionsBot: boolean
  shouldForkToThread: boolean
  userId: string
  conversationId: string
  slackEvent: FileShareMessageEvent
}

const _getOrCreateMessageFromFiles = async ({
  mentionsBot,
  shouldForkToThread,
  userId,
  conversationId,
  slackEvent,
  client,
  logger,
}: HandlerEventProps & _GetOrCreateMessageFromFilesArgs) => {
  const parsedEvent = _parseFileSlackEvent(slackEvent)
  if (!parsedEvent.type) {
    return
  }

  const tags = {
    ts: slackEvent.ts,
    userId: slackEvent.user,
    channelId: slackEvent.channel,
    mentionsBot: mentionsBot ? 'true' : undefined,
    forkedToThread: String(shouldForkToThread),
  }

  const discriminateByTags: MessageTag[] | undefined = shouldForkToThread
    ? ['ts', 'channelId', 'forkedToThread']
    : ['ts', 'channelId']

  if (parsedEvent.type === 'file') {
    const { payload: file } = parsedEvent

    const blocItem = _parseSlackFile(logger, file)
    if (!blocItem) {
      return
    }

    await client.getOrCreateMessage({
      tags,
      userId,
      conversationId,
      discriminateByTags,
      ...blocItem,
    } as bp.ClientRequests['getOrCreateMessage'])

    return
  }

  const items: BlocItem[] = []

  if (slackEvent.text) {
    items.push({ type: 'text', payload: { text: slackToMarkdown(slackEvent.text) } })
  }

  for (const file of parsedEvent.items) {
    const item = _parseSlackFile(logger, file)
    if (item) {
      items.push(item)
    }
  }

  await client.getOrCreateMessage({
    tags,
    userId,
    conversationId,
    discriminateByTags,
    type: 'bloc',
    payload: { items },
  })
}

const _parseSlackFile = (logger: bp.Logger, file: File): BlocItem | null => {
  type MsgTypes = (typeof msgTypes)[number]
  const msgTypes = ['image', 'audio', 'file', 'text'] as const // TODO use zod or botpress sdk
  const isMsgType = (t: string): t is MsgTypes => msgTypes.includes(t as MsgTypes)

  const fileType = file.mimetype.split('/')[0]
  if (!fileType || !isMsgType(fileType)) {
    logger.forBot().info('File of type', fileType, 'is not yet supported.')
    return null
  }

  switch (fileType) {
    case 'image':
      return { type: fileType, payload: { imageUrl: file.permalink_public! } }

    case 'audio':
      return { type: fileType, payload: { audioUrl: file.permalink_public! } }

    case 'file':
      return { type: fileType, payload: { fileUrl: file.permalink_public! } }

    case 'text':
      return { type: 'file', payload: { fileUrl: file.permalink_public! } }

    default:
      fileType satisfies never
      logger.forBot().info('File of type', fileType, 'is not yet supported.')
      return null
  }
}

const _parseSlackEventText = (slackEvent: GenericMessageEvent | FileShareMessageEvent): string | null => {
  if (slackEvent.text === undefined || typeof slackEvent.text !== 'string' || !slackEvent.text?.length) {
    return null
  }
  return slackEvent.text
}

type File = NonNullable<FileShareMessageEvent['files']>[number]
type _ParsedFileSlackEvent =
  | {
      type: null
    }
  | {
      type: 'file'
      payload: File
    }
  | {
      type: 'bloc'
      text: string | null
      items: File[]
    }
const _parseFileSlackEvent = (slackEvent: FileShareMessageEvent): _ParsedFileSlackEvent => {
  if (!slackEvent.files) {
    return { type: null }
  }

  const [file] = slackEvent.files
  if (!file) {
    return { type: null }
  }

  const text = _parseSlackEventText(slackEvent)
  if (slackEvent.files.length === 1 && !text) {
    return { type: 'file', payload: file }
  }

  return { type: 'bloc', text, items: slackEvent.files }
}
