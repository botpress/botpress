import { z } from '@botpress/sdk'
import { IntegrationProps } from '.botpress'

type WebhookHandler = IntegrationProps['handler']

const CannyWebhookPayloadSchema = z.object({
  type: z.enum(['post.created', 'comment.created']),
  data: z.any(),
})

export const webhook: WebhookHandler = async ({ req, client }) => {
  if (req.method !== 'POST') {
    return { status: 405, body: 'Method not allowed' }
  }

  try {
    const payload = CannyWebhookPayloadSchema.parse(req.body)

    switch (payload.type) {
      case 'post.created':
        await handlePostCreated(client, payload.data)
        break

      case 'comment.created':
        await handleCommentCreated(client, payload.data)
        break

      default:
    }

    return { status: 200, body: 'OK' }
  } catch (error) {
    console.error('Webhook processing error:', error)
    return { status: 500, body: 'Internal server error' }
  }
}

async function handlePostCreated(client: Parameters<WebhookHandler>[0]['client'], postData: any) {
  try {
    const { conversation } = await client.createConversation({
      channel: 'posts',
      tags: {
        cannyPostId: postData.id,
        cannyBoardId: postData.board.id,
      },
    })

    await client.createMessage({
      conversationId: conversation.id,
      type: 'text',
      payload: {
        text: `**${postData.title}**\n\n${postData.details || ''}\n\n*Posted by ${postData.author?.name || 'Unknown'}*`,
      },
      userId: postData.author?.id || 'canny-system',
      tags: {
        cannyType: 'post',
        cannyPostId: postData.id,
      },
    })
  } catch (error) {
    console.error('Error handling post creation:', error)
  }
}

async function handleCommentCreated(client: Parameters<WebhookHandler>[0]['client'], commentData: any) {
  try {
    const { conversations } = await client.listConversations({
      tags: {
        cannyPostId: commentData.post.id,
      },
    })

    const conversation = conversations[0]
    if (!conversation) {
      return
    }

    await client.createMessage({
      conversationId: conversation.id,
      type: 'text',
      payload: {
        text: commentData.value,
      },
      userId: commentData.author.id,
      tags: {
        cannyType: 'comment',
        cannyCommentId: commentData.id,
        cannyPostId: commentData.post.id,
      },
    })
  } catch (error) {
    console.error('Error handling comment creation:', error)
  }
}
