import { RuntimeError } from '@botpress/sdk'
import { getAccessToken, NO_ACCESS_TOKEN_ERROR } from './auth'
import { Client } from './client'
import { IntegrationProps } from '.botpress'


const comments: IntegrationProps['channels']['comments'] = {
  messages: {
    text: async ({ conversation, ctx, ack, payload, logger, client }) => {
      const taskId = conversation.tags['id']!
      const content = payload.text

      const accessToken = await getAccessToken(client, ctx)
      if (!accessToken) {
        throw new RuntimeError(NO_ACCESS_TOKEN_ERROR)
      }

      const todoistClient = new Client(accessToken)
      logger.forBot().info(`Creating comment on task "${taskId}" with content: "${content}"`)
      const comment = await todoistClient.createComment(taskId, content)
      await ack({
        tags: {
          id: comment.id,
        },
      })
    },
  },
}

export default {
  comments,
} satisfies IntegrationProps['channels']
