import { slackToMarkdown } from '@bpinternal/slackdown'
import {
  ActionsBlockElement,
  AllMessageEvents,
  ContextBlockElement,
  FileShareMessageEvent,
  GenericMessageEvent,
  RichTextBlockElement,
  RichTextElement,
  RichTextSection,
} from '@slack/types'
import { Mention, MessageTag } from 'definitions/schemas/messages'
import {
  ChannelMention,
  ChannelReplyLocation,
  DmReplyLocation,
  replyBehaviourSchema,
  ThreadMention,
} from 'definitions/schemas/reply-behaviour'
import { getBotpressUserFromSlackUser, updateBotpressUserFromSlackUser } from 'src/misc/utils'
import * as bp from '.botpress'

type BlocItem =
  | bp.channels.channel.bloc.Bloc['items'][number]
  | {
      type: 'text'
      payload: {
        mentions: Mention[]
        text: string
      }
    }

export type HandleEventProps = {
  slackEvent: AllMessageEvents
  client: bp.Client
  ctx: bp.Context
  logger: bp.Logger
}

type MessageOrigin = 'dm' | 'dmThread' | 'channel' | 'channelThread'

// NOTE: Derives conversation tag keys from the generated bp.channels types per channel
type ChannelConversationTagKeys = {
  channel: keyof bp.channels.channel.Channel['conversation']['tags']
  dm: keyof bp.channels.dm.Dm['conversation']['tags']
  thread: keyof bp.channels.thread.Thread['conversation']['tags']
  dmThread: keyof bp.channels.dmThread.DmThread['conversation']['tags']
}

type ChannelType = keyof ChannelConversationTagKeys

// NOTE: Using a distributive mapped type to produce a proper discriminated union when C is a union
type ConversationTargetFor<C extends ChannelType> = {
  channel: C
  tags: Partial<Record<ChannelConversationTagKeys[C], string>>
  discriminateByTags: ChannelConversationTagKeys[C][]
}

type ConversationTarget = { [C in ChannelType]: ConversationTargetFor<C> }[ChannelType]

type _SendMessageProps = HandleEventProps & {
  botpressConversation: { id: string }
  botpressUser: { id: string }
  tags: Record<MessageTag, string | undefined>
  discriminateByTags: MessageTag[] | undefined
}

export const handleEvent = async (props: HandleEventProps): Promise<void> => {
  const { slackEvent, client, ctx, logger } = props
  logger.forBot().debug('handleEvent called with slackEvent', { slackEvent })

  // NOTE: Skip notification-type messages (channel_join, channel_leave, etc.)
  if (slackEvent.subtype && slackEvent.subtype !== 'file_share') {
    return
  }

  const { botpressUser } = await getBotpressUserFromSlackUser({ slackUserId: slackEvent.user }, client)
  await updateBotpressUserFromSlackUser(slackEvent.user, botpressUser, client, ctx, logger)

  const mentionsBotInMessage = await _isBotMentionedInMessage({ slackEvent, client, ctx })
  const origin = _classifyMessageOrigin(slackEvent)

  const { channelMention, threadMention, channelReplyLocation, dmReplyLocation } = replyBehaviourSchema.parse(
    ctx.configuration.replyBehaviour
  )

  const targets = _resolveConversationTargets({
    origin,
    slackEvent,
    mentionsBotInMessage,
    channelMention,
    threadMention,
    channelReplyLocation,
    dmReplyLocation,
  })

  if (targets.length === 0) {
    logger
      .forBot()
      .debug(
        `Message ignored: ${JSON.stringify({ origin, mentionsBotInMessage, channelMention, threadMention, channelReplyLocation, dmReplyLocation })}`
      )
    return
  }

  // NOTE: Create conversations and send messages for each resolved target
  for (const target of targets) {
    const { conversation: botpressConversation } = await _getOrCreateConversation(client, target)

    const conversationBotMentioned = botpressConversation.tags.mentionsBot === 'true'
    const effectiveMentionsBot = conversationBotMentioned || mentionsBotInMessage

    // NOTE: For inherit mode, the bot should continue responding in threads it was already engaged in
    if (origin === 'channelThread' && threadMention === 'inherit') {
      const botAlreadyEngaged = effectiveMentionsBot || channelMention === 'notRequired'
      if (!botAlreadyEngaged) {
        logger.forBot().debug('Thread message skipped: inherit mode and no bot mention found')
        continue
      }
    }

    if (effectiveMentionsBot) {
      await client.updateConversation({
        id: botpressConversation.id,
        tags: { mentionsBot: 'true' },
      })
    }

    const isThreadTarget = target.channel === 'thread' || target.channel === 'dmThread'

    await _sendMessage({
      botpressConversation,
      botpressUser,
      tags: {
        ts: slackEvent.ts,
        userId: slackEvent.user,
        channelId: slackEvent.channel,
        channelOrigin: target.channel,
        forkedToThread: isThreadTarget ? 'true' : undefined,
        mentionsBot: effectiveMentionsBot ? 'true' : undefined,
      },
      discriminateByTags: ['ts', 'channelId'],
      slackEvent,
      client,
      ctx,
      logger,
    })
  }
}

const _classifyMessageOrigin = (slackEvent: AllMessageEvents): MessageOrigin => {
  const isDm = slackEvent.channel.startsWith('D')
  const isThread = 'thread_ts' in slackEvent && !!slackEvent.thread_ts

  if (isDm && isThread) {
    return 'dmThread'
  }
  if (isDm) {
    return 'dm'
  }
  if (isThread) {
    return 'channelThread'
  }
  return 'channel'
}

// NOTE: Not all AllMessageEvents union members have thread_ts, so we safely extract it with a runtime check
const _getThreadTs = (slackEvent: AllMessageEvents): string | undefined => {
  if ('thread_ts' in slackEvent && typeof slackEvent.thread_ts === 'string') {
    return slackEvent.thread_ts
  }
  return undefined
}

type ResolveTargetsParams = {
  origin: MessageOrigin
  slackEvent: AllMessageEvents
  mentionsBotInMessage: boolean
  channelMention: ChannelMention
  threadMention: ThreadMention
  channelReplyLocation: ChannelReplyLocation
  dmReplyLocation: DmReplyLocation
}

const _resolveConversationTargets = (params: ResolveTargetsParams): ConversationTarget[] => {
  const {
    origin,
    slackEvent,
    mentionsBotInMessage,
    channelMention,
    threadMention,
    channelReplyLocation,
    dmReplyLocation,
  } = params

  const mentionsBotTag = mentionsBotInMessage ? 'true' : undefined
  const threadTs = _getThreadTs(slackEvent) ?? slackEvent.ts

  const channelTarget: ConversationTargetFor<'channel'> = {
    channel: 'channel',
    tags: { id: slackEvent.channel, mentionsBot: mentionsBotTag },
    discriminateByTags: ['id'],
  }

  const threadTarget: ConversationTargetFor<'thread'> = {
    channel: 'thread',
    tags: {
      id: slackEvent.channel,
      thread: threadTs,
      mentionsBot: mentionsBotTag,
      isBotReplyThread: 'true',
    },
    discriminateByTags: ['id', 'thread'],
  }

  const dmTarget: ConversationTargetFor<'dm'> = {
    channel: 'dm',
    tags: { id: slackEvent.channel, mentionsBot: mentionsBotTag },
    discriminateByTags: ['id'],
  }

  const dmThreadTarget: ConversationTargetFor<'dmThread'> = {
    channel: 'dmThread',
    tags: {
      id: slackEvent.channel,
      thread: threadTs,
      mentionsBot: mentionsBotTag,
      isBotReplyThread: 'true',
    },
    discriminateByTags: ['id', 'thread'],
  }

  switch (origin) {
    // NOTE: DM messages — always respond, route per dmReplyLocation
    case 'dm': {
      if (dmReplyLocation === 'dm') {
        return [dmTarget]
      }
      if (dmReplyLocation === 'thread') {
        return [dmThreadTarget]
      }
      return [dmTarget, dmThreadTarget] // 'both'
    }

    // NOTE: DM thread messages — if dmReplyLocation is dm or thread, collapse to thread reply;
    // if 'both', reply in both dm channel and dm thread
    case 'dmThread': {
      if (dmReplyLocation === 'dm' || dmReplyLocation === 'thread') {
        return [dmThreadTarget]
      }
      return [dmTarget, dmThreadTarget] // 'both'
    }

    // NOTE: Channel messages — gated by channelMention
    case 'channel': {
      if (!_isChannelMentionSatisfied(channelMention, mentionsBotInMessage)) {
        return []
      }

      if (channelReplyLocation === 'channel') {
        return [channelTarget]
      }
      if (channelReplyLocation === 'thread') {
        return [threadTarget]
      }
      return [channelTarget, threadTarget] // 'both'
    }

    // NOTE: Channel thread messages — gated by threadMention (inherit deferred to handleEvent)
    case 'channelThread': {
      if (!_isThreadMentionSatisfied(threadMention, mentionsBotInMessage)) {
        return []
      }

      if (channelReplyLocation === 'channel' || channelReplyLocation === 'thread') {
        return [threadTarget]
      }
      return [channelTarget, threadTarget] // 'both'
    }
  }
}

const _isChannelMentionSatisfied = (channelMention: ChannelMention, mentionsBotInMessage: boolean): boolean => {
  if (channelMention === 'notRequired') {
    return true
  }
  return mentionsBotInMessage
}

// NOTE: For 'inherit' mode, we do an optimistic check here using the message-level mention.
// The conversation-level mentionsBot tag is checked after getOrCreateConversation in handleEvent.
const _isThreadMentionSatisfied = (threadMention: ThreadMention, mentionsBotInMessage: boolean): boolean => {
  switch (threadMention) {
    case 'notRequired':
      return true
    case 'required':
      return mentionsBotInMessage
    case 'inherit':
      // NOTE: Return true optimistically; the full inherit check (conversation tag OR message mention)
      // happens in handleEvent after the conversation is fetched
      return true
  }
}

// ---------------------------------------------------------------------------
// Conversation Creation
// ---------------------------------------------------------------------------

// NOTE: Dispatches getOrCreateConversation per channel type so TypeScript can narrow the discriminateByTags union
const _getOrCreateConversation = (
  client: bp.Client,
  target: ConversationTarget
): ReturnType<bp.Client['getOrCreateConversation']> => {
  switch (target.channel) {
    case 'channel':
      return client.getOrCreateConversation({
        channel: target.channel,
        tags: target.tags,
        discriminateByTags: target.discriminateByTags,
      })
    case 'dm':
      return client.getOrCreateConversation({
        channel: target.channel,
        tags: target.tags,
        discriminateByTags: target.discriminateByTags,
      })
    case 'thread':
      return client.getOrCreateConversation({
        channel: target.channel,
        tags: target.tags,
        discriminateByTags: target.discriminateByTags,
      })
    case 'dmThread':
      return client.getOrCreateConversation({
        channel: target.channel,
        tags: target.tags,
        discriminateByTags: target.discriminateByTags,
      })
  }
}

async function _isBotMentionedInMessage({
  slackEvent,
  client,
  ctx,
}: {
  slackEvent: AllMessageEvents
  client: bp.Client
  ctx: bp.Context
}) {
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

const _sendMessage = async (props: _SendMessageProps) => {
  const { slackEvent, client, ctx, logger, botpressConversation, botpressUser, tags, discriminateByTags } = props

  if (slackEvent.subtype === 'file_share') {
    await _getOrCreateMessageFromFiles({
      ctx,
      botpressConversation,
      botpressUser,
      slackEvent,
      client,
      logger,
      tags,
      discriminateByTags,
    })
    return
  }

  if (slackEvent.subtype) {
    return
  }
  const text = _parseSlackEventText(slackEvent)
  if (!text) {
    logger.forBot().debug('No text was received, so the message was ignored')
    return
  }

  await client.getOrCreateMessage({
    type: 'text',
    payload: await _getTextPayloadFromSlackEvent(slackEvent, client, ctx, logger),
    userId: botpressUser.id,
    conversationId: botpressConversation.id,
    tags,
    discriminateByTags,
  })
}

const _getOrCreateMessageFromFiles = async ({
  ctx,
  botpressUser,
  botpressConversation,
  slackEvent,
  client,
  logger,
  tags,
  discriminateByTags,
}: _SendMessageProps & {
  slackEvent: FileShareMessageEvent
}) => {
  const parsedEvent = _parseFileSlackEvent(slackEvent)
  if (!parsedEvent.type) {
    return
  }

  const { id: userId } = botpressUser
  const { id: conversationId } = botpressConversation

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
    items.push({ type: 'text', payload: await _getTextPayloadFromSlackEvent(slackEvent, client, ctx, logger) })
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
  const fileType = file.mimetype.split('/')[0]
  if (!fileType) {
    logger.forBot().info('File of type', fileType, 'is not yet supported.')
    return null
  }

  if (!file.permalink_public) {
    logger.forBot().info('File had no public permalink')
    return null
  }

  switch (fileType) {
    case 'image':
      return { type: fileType, payload: { imageUrl: file.permalink_public } }

    case 'audio':
      return { type: fileType, payload: { audioUrl: file.permalink_public } }

    case 'file':
      return { type: fileType, payload: { fileUrl: file.permalink_public } }

    case 'text':
      return { type: 'file', payload: { fileUrl: file.permalink_public } }

    default:
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

const _getTextPayloadFromSlackEvent = async (
  slackEvent: GenericMessageEvent | FileShareMessageEvent,
  client: bp.Client,
  ctx: bp.Context,
  logger: bp.Logger
): Promise<{
  text: string
  mentions: Mention[]
}> => {
  if (!slackEvent.text) {
    return { text: '', mentions: [] }
  }
  let text = slackEvent.text
  const mentions: Mention[] = []
  const blocks = slackEvent.blocks ?? []

  type BlockElement = ContextBlockElement | ActionsBlockElement | RichTextBlockElement
  type BlockSubElement = RichTextSection | RichTextElement
  const userElements = blocks
    .flatMap((block): BlockElement[] => ('elements' in block ? block.elements : []))
    .flatMap((element): BlockSubElement[] => ('elements' in element ? element.elements : []))
    .filter((subElement) => subElement.type === 'user')

  for (const userElement of userElements) {
    const { botpressUser } = await getBotpressUserFromSlackUser({ slackUserId: userElement.user_id }, client)
    await updateBotpressUserFromSlackUser(userElement.user_id, botpressUser, client, ctx, logger)
    if (!botpressUser.name) {
      continue
    }
    text = text.replace(userElement.user_id, botpressUser.name)
    mentions.push({ type: userElement.type, start: 1, end: 1, user: { id: botpressUser.id, name: botpressUser.name } })
  }

  for (const mention of mentions) {
    if (!mention.user.name) {
      continue
    }
    mention.start = text.search(mention.user.name)
    mention.end = mention.start + mention.user.name.length
  }
  text = slackToMarkdown(text)

  return { text, mentions }
}
