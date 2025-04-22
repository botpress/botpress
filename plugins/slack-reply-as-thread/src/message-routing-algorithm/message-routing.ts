import type * as client from '@botpress/client'
import * as bp from '.botpress'

type MessageRoutingResult = {
  shouldPreventBotFromReplying: boolean
  shouldForkToReplyThread: boolean
}

export function getMessageRouting({
  message,
  conversation,
  configuration,
}: {
  configuration: bp.configuration.Configuration
  message: Pick<client.Message, 'tags'>
  conversation: Pick<client.Conversation, 'channel' | 'tags'>
}): MessageRoutingResult {
  const isBotMentioned = !!message.tags.mentionsBot
  const isInChannel = conversation.channel === 'channel'
  const isInThread = conversation.channel === 'thread'
  const isInDM = !isInChannel && !isInThread
  const isBotReplyThread = !!conversation.tags.isBotReplyThread
  const isThreadingEnabled = !!configuration.enableThreading
  const isMentionRequired = !!configuration.ignoreMessagesWithoutMention

  return {
    shouldPreventBotFromReplying:
      isInDM || (isInChannel && isThreadingEnabled) || (!isBotReplyThread && !isBotMentioned && isMentionRequired),
    shouldForkToReplyThread: isInChannel && isThreadingEnabled && !(isMentionRequired && !isBotMentioned),
  }
}
