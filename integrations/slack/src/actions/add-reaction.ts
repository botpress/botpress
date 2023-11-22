import { WebClient } from '@slack/web-api'
import { Implementation } from '../misc/types'
import { getAccessToken, getTag } from '../misc/utils'

export const addReaction: Implementation['actions']['addReaction'] = async ({ ctx, client, logger, input }) => {
  logger.forBot().debug('Received action addReaction with input:', input)
  const accessToken = await getAccessToken(client, ctx)
  const slackClient = new WebClient(accessToken)

  if (input.messageId) {
    const { message } = await client.getMessage({ id: input.messageId })
    const { conversation } = await client.getConversation({ id: message.conversationId })

    const addReactionArgs = {
      name: input.name,
      channel: getTag(conversation.tags, 'id'),
      timestamp: getTag(message.tags, 'ts'),
    }

    logger.forBot().debug('Sending reaction to Slack:', addReactionArgs)
    await slackClient.reactions.add(addReactionArgs)
  }

  return {}
}
