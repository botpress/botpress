import { RuntimeError } from '@botpress/client'
import { wrapActionAndInjectSlackClient } from 'src/actions/action-wrapper'
import { SlackScopes } from 'src/misc/slack-scopes'

type WrapActionAction = Parameters<
  typeof wrapActionAndInjectSlackClient<'startTypingIndicator' | 'stopTypingIndicator'>
>[1]['action']
type InjectedProps = Parameters<WrapActionAction>[0]
type ActionInput = Parameters<WrapActionAction>[1]

export const startTypingIndicator = wrapActionAndInjectSlackClient('startTypingIndicator', {
  async action(props, input) {
    if (props.ctx.configuration.typingIndicatorEmoji) {
      await modifyReaction({
        reactionName: 'eyes',
        type: 'add',
        props,
        input,
      })
    }
    await markAsSeen({ props, input })
    return {}
  },
  errorMessage: 'Failed to start typing indicator',
})

export const stopTypingIndicator = wrapActionAndInjectSlackClient('stopTypingIndicator', {
  async action(props, input) {
    if (!(await checkHasReaction({ reactionName: 'eyes', input, props }))) {
      props.logger.forBot().debug('No typing indicator to stop')
      return {}
    }
    await modifyReaction({
      reactionName: 'eyes',
      type: 'remove',
      props,
      input,
    })
    return {}
  },
  errorMessage: 'Failed to stop typing indicator',
})

const markAsSeen = async ({
  props: { client, ctx, logger, slackClient },
  input: { conversationId, messageId },
}: {
  props: InjectedProps
  input: ActionInput
}) => {
  const { message } = await client.getMessage({ id: messageId })
  const { conversation } = await client.getConversation({ id: conversationId })
  logger.forBot().debug(`Marking message ${messageId} as seen in conversation ${conversationId} (typing indicator)`)

  const channel = conversation.tags.id
  const ts = message.tags.ts
  if (!channel) {
    throw new RuntimeError('Channel ID is missing in conversation tags')
  }
  if (!ts) {
    throw new RuntimeError('Timestamp is missing in message tags')
  }
  const markAsSeenArgs = {
    channel,
    ts,
  }
  await SlackScopes.ensureHasAllScopes({
    client,
    ctx,
    requiredScopes: ['channels:manage', 'groups:write', 'im:write', 'mpim:write'],
    operation: 'conversations.mark',
  })
  await slackClient.conversations.mark(markAsSeenArgs)
}

const checkHasReaction = async ({
  reactionName,
  input: { conversationId, messageId },
  props: { client, slackClient, ctx, logger },
}: {
  reactionName: string
  input: ActionInput
  props: InjectedProps
}): Promise<boolean> => {
  const { message } = await client.getMessage({ id: messageId })
  const { conversation } = await client.getConversation({ id: conversationId })
  const reactionArgs: Parameters<typeof slackClient.reactions.get>[0] = {
    channel: conversation.tags.id,
    timestamp: message.tags.ts,
    full: true,
  }

  const operation = 'reactions.get'
  await SlackScopes.ensureHasAllScopes({
    client,
    ctx,
    requiredScopes: ['reactions:read'],
    operation,
  })
  logger
    .forBot()
    .debug(
      `Checking if reaction is present in Slack message ${messageId} in conversation ${conversationId} (typing indicator): ${reactionName}`
    )
  const { message: slackMessage } = await slackClient.reactions.get(reactionArgs)
  return !!slackMessage?.reactions?.some((reaction) => reaction.name === reactionName)
}

const modifyReaction = async ({
  reactionName,
  type,
  input: { conversationId, messageId },
  props: { client, slackClient, ctx, logger },
}: {
  reactionName: string
  type: 'add' | 'remove'
  input: ActionInput
  props: InjectedProps
}) => {
  const { message } = await client.getMessage({ id: messageId })
  const { conversation } = await client.getConversation({ id: conversationId })
  const reactionArgs = {
    name: reactionName,
    channel: conversation.tags.id,
    timestamp: message.tags.ts,
  }

  const operation = type === 'add' ? 'reactions.add' : 'reactions.remove'
  await SlackScopes.ensureHasAllScopes({
    client,
    ctx,
    requiredScopes: ['reactions:write'],
    operation,
  })
  logger
    .forBot()
    .debug(
      `Sending reaction to Slack message ${messageId} in conversation ${conversationId} (typing indicator): ${type} ${reactionName}`
    )
  if (type === 'add') {
    await slackClient.reactions.add(reactionArgs)
  } else {
    await slackClient.reactions.remove(reactionArgs)
  }
}
