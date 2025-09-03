import { CannyClient } from '../misc/canny-client'
import { IntegrationProps } from '.botpress'

type WebhookHandler = IntegrationProps['handler']

type CannyWebhookPayload = {
  type: 'post.created' | 'comment.created'
  data: any
}

export const webhook: WebhookHandler = async ({ req, client, ctx }) => {
  if (req.method !== 'POST') {
    return { status: 405, body: 'Method not allowed' }
  }

  try {
    if (!req.body || typeof req.body !== 'object') {
      throw new Error('Invalid webhook payload')
    }
    const payload = req.body as CannyWebhookPayload

    switch (payload.type) {
      case 'post.created':
        await handlePostCreated(client, ctx, payload.data)
        break

      case 'comment.created':
        await handleCommentCreated(client, ctx, payload.data)
        break

      default:
        console.log(`Unhandled webhook type: ${payload.type}`)
    }

    return { status: 200, body: 'OK' }
  } catch (error) {
    console.error('Webhook processing error:', error)
    return { status: 500, body: 'Internal server error' }
  }
}

async function handlePostCreated(client: any, ctx: any, postData: any) {
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

async function handleCommentCreated(client: any, ctx: any, commentData: any) {
  try {
    const { conversations } = await client.listConversations({
      tags: {
        cannyPostId: commentData.post.id,
      },
    })

    if (conversations.length === 0) {
      console.log(`No conversation found for post ${commentData.post.id}`)
      return
    }

    const conversation = conversations[0]

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
