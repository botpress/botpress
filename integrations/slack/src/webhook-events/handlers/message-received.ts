import { slackToMarkdown } from '@bpinternal/slackdown'
import { AllMessageEvents, FileShareMessageEvent, GenericMessageEvent } from '@slack/types'
import {
  getBotpressConversationFromSlackThread,
  getBotpressUserFromSlackUser,
  updateBotpressuserFromSlackUser,
} from 'src/misc/utils'
import * as bp from '.botpress'

type BlocItem = bp.channels.channel.bloc.Bloc['items'][number]
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
  await updateBotpressuserFromSlackUser(slackEvent.user, botpressUser, client, ctx, logger)

  const mentionsBot = await _isBotMentionedInMessage({ slackEvent, client, ctx })

  for (const block of slackEvent.blocks ?? []) {
    if (!('elements' in block)) {
      continue
    }
    for (const element of block.elements) {
      if (!('elements' in element)) {
        continue
      }
      for (const subElement of element.elements) {
        if (subElement.type !== 'user') {
          continue
        }
        const { botpressUser } = await getBotpressUserFromSlackUser({ slackUserId: subElement.user_id }, client)
        await updateBotpressuserFromSlackUser(subElement.user_id, botpressUser, client, ctx, logger)
        subElement.user_id = botpressUser.name!
        slackEvent.text?.replace('<@' + subElement.user_id + '>', '<@' + botpressUser.name! + '>')
      }
    }
  }

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
    payload: { text: slackToMarkdown(text) },
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
  const fileType = file.mimetype.split('/')[0]
  if (!fileType) {
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
