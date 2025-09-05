import { CannyClient } from '../misc/canny-client'

export const posts = {
  messages: {
    text: async ({ payload, ctx, conversation, ack }: any) => {
      const client = CannyClient.create({
        apiKey: ctx.configuration.apiKey,
      })

      const postId = conversation.tags?.cannyPostId
      if (!postId) {
        throw new Error('No post ID found in conversation')
      }

      const botUser = await client.createOrUpdateUser({
        name: 'BotpressIntegration',
        userId: 'botpress-integration-user',
        email: 'integration@botpress.com',
      })
      const authorId = botUser.id

      await client.createComment({
        authorId,
        postId,
        value: payload.text,
      })

      await ack()
    },

    image: async ({ payload, ctx, conversation, ack }: any) => {
      const client = CannyClient.create({
        apiKey: ctx.configuration.apiKey,
      })

      const postId = conversation.tags?.cannyPostId
      if (!postId) {
        throw new Error('No post ID found in conversation')
      }

      const botUser = await client.createOrUpdateUser({
        name: 'BotpressIntegration',
        userId: 'botpress-integration-user',
        email: 'integration@botpress.com',
      })
      const authorId = botUser.id

      await client.createComment({
        authorId,
        postId,
        value: payload.caption || 'Image attached',
        imageURLs: [payload.imageUrl],
      })

      await ack()
    },
  },
}
