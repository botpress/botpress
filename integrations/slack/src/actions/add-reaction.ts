import { WebClient } from '@slack/web-api'
import { getAccessToken } from '../misc/utils'
import * as bp from '.botpress'

export const addReaction: bp.IntegrationProps['actions']['addReaction'] = async ({ ctx, client, logger, input }) => {
  logger.forBot().debug('Received action addReaction with input:', input)
  const accessToken = await getAccessToken(client, ctx)
  const slackClient = new WebClient(accessToken)

  if (input.messageId) {
    const { message } = await client.getMessage({ id: input.messageId })
    const { conversation } = await client.getConversation({ id: message.conversationId })

    const addReactionArgs = {
      name: input.name,
      channel: conversation.tags.id,
      timestamp: message.tags.ts,
    }

    logger.forBot().debug('Sending reaction to Slack:', addReactionArgs)
    await slackClient.reactions.add(addReactionArgs)
  }

  return {}
}
