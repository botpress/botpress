import { IntegrationProps } from '@botpress/sdk'
import { LinearWebhooks, LINEAR_WEBHOOK_SIGNATURE_HEADER, LINEAR_WEBHOOK_TS_FIELD } from '@linear/sdk'

import { getUser } from './actions/get-user'
import { fireIssueCreated } from './events/issueCreated'
import { fireIssueUpdated } from './events/issueUpdated'
import { handleOauth } from './misc/linear'
import { getUserAndConversation } from './misc/utils'
import { secrets } from '.botpress'

export const handler: IntegrationProps['handler'] = async ({ req, ctx, client, logger }) => {
  if (req.path === '/oauth') {
    return handleOauth(req, client, ctx)
  }

  if (!req.body) {
    return
  }

  const linearEvent = JSON.parse(req.body)

  const webhookSignatureHeader = req.headers[LINEAR_WEBHOOK_SIGNATURE_HEADER]
  if (!webhookSignatureHeader) {
    return
  }

  // Verify the request, it will throw an error in case of not coming from linear
  const webhook = new LinearWebhooks(secrets.WEBHOOK_SIGNING_SECRET)
  // are we sure it throws? it returns a boolean , add char to test this
  webhook.verify(Buffer.from(req.body), webhookSignatureHeader, linearEvent[LINEAR_WEBHOOK_TS_FIELD])

  const eventType = linearEvent.type.toLowerCase()

  // ============ EVENTS ==============
  if (eventType === 'issue' && linearEvent.action === 'create') {
    await fireIssueCreated({ linearEvent, client })
    return
  }

  if (eventType === 'issue' && linearEvent.action === 'update') {
    await fireIssueUpdated({ linearEvent, client })
    return
  }

  // ============ MESSAGES ==============

  const linearUserId = linearEvent.data.userId ?? linearEvent.data.user?.id
  if (!linearUserId) {
    // this means the message is actually coming from the bot itself, so we don't want to process it
    return
  }

  if (eventType === 'comment' && linearEvent.action === 'create') {
    const linearCommentId = linearEvent.data.id
    const issueConversationId = linearEvent.data.issueId || linearEvent.data.issue.id
    const content = linearEvent.data.body

    const { userId, conversationId } = await getUserAndConversation(
      {
        linearIssueId: issueConversationId,
        linearUserId,
      },
      client
    )

    console.info('before linear user', ctx)

    const linearUser = await getUser({
      client,
      ctx,
      input: { linearUserId },
      type: 'getUser',
      logger,
    })

    console.info('linearUser', linearUser)

    await client.setState({
      id: userId,
      type: 'user',
      name: 'profile',
      payload: linearUser,
    })

    await client.createMessage({
      tags: { id: linearCommentId },
      type: 'text',
      payload: { text: content },
      conversationId,
      userId,
    })
  }
}
