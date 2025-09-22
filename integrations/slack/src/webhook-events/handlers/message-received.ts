import { z } from '@botpress/sdk'
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
import { textSchema } from 'definitions/channels/text-input-schema'
import {
  getBotpressConversationFromSlackThread,
  getBotpressUserFromSlackUser,
  updateBotpressUserFromSlackUser,
} from 'src/misc/utils'
import * as bp from '.botpress'

type Mention = NonNullable<z.infer<typeof textSchema>['mentions']>[number]

type BlocItem =
  | bp.channels.channel.bloc.Bloc['items'][number]
  | {
      type: 'text'
      payload: {
        mentions: Mention[]
        text: string
      }
    }

type MessageTag = keyof bp.ClientRequests['getOrCreateMessage']['tags']

export type HandleEventProps = {
  slackEvent: AllMessageEvents
  client: bp.Client
  ctx: bp.Context
  logger: bp.Logger
}

export const handleEvent = async (props: HandleEventProps) => {
  const { slackEvent, client, ctx, logger } = props

  // do not handle notification-type messages such as channel_join, channel_leave, etc:
  if (slackEvent.subtype && slackEvent.subtype !== 'file_share') {
    return
  }

  const { botpressConversation } = await getBotpressConversationFromSlackThread(
    { slackChannelId: slackEvent.channel, slackThreadId: slackEvent.thread_ts },
    client
  )
  const { botpressUser } = await getBotpressUserFromSlackUser({ slackUserId: slackEvent.user }, client)
  await updateBotpressUserFromSlackUser(slackEvent.user, botpressUser, client, ctx, logger)

  const mentionsBot = await _isBotMentionedInMessage({ slackEvent, client, ctx })
  const isSentInChannel = !slackEvent.thread_ts
  const isThreadingEnabled = ctx.configuration.createReplyThread?.enabled ?? false
  const threadingRequiresMention = ctx.configuration.createReplyThread?.onlyOnBotMention ?? false
  const shouldForkToReplyThread = isSentInChannel && isThreadingEnabled && (!threadingRequiresMention || mentionsBot)

  await _sendMessage({
    botpressConversation,
    botpressUser,
    tags: {
      ts: slackEvent.ts,
      userId: slackEvent.user,
      channelId: slackEvent.channel,
      mentionsBot: mentionsBot ? 'true' : undefined,
      forkedToThread: 'false',
    },
    discriminateByTags: ['ts', 'channelId'],
    slackEvent,
    client,
    ctx,
    logger,
  })

  if (!shouldForkToReplyThread) {
    return
  }

  const { conversation: threadConversation } = await client.getOrCreateConversation({
    channel: 'thread',
    tags: { id: slackEvent.channel, thread: slackEvent.ts, isBotReplyThread: 'true' },
    discriminateByTags: ['id', 'thread'],
  })

  await _sendMessage({
    botpressConversation: threadConversation,
    botpressUser,
    tags: {
      ts: slackEvent.ts,
      userId: slackEvent.user,
      channelId: slackEvent.channel,
      mentionsBot: mentionsBot ? 'true' : undefined,
      forkedToThread: 'true',
    },
    discriminateByTags: ['ts', 'channelId', 'forkedToThread'],
    slackEvent,
    client,
    ctx,
    logger,
  })
}

type _SendMessageProps = HandleEventProps & {
  botpressConversation: { id: string }
  botpressUser: { id: string }
  tags: Record<MessageTag, string | undefined>
  discriminateByTags: MessageTag[] | undefined
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
