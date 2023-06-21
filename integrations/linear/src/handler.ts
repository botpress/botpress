import { IntegrationProps } from '@botpress/sdk'
import { LinearWebhooks, LINEAR_WEBHOOK_SIGNATURE_HEADER, LINEAR_WEBHOOK_TS_FIELD } from '@linear/sdk'

import { fireIssueCreated } from './events/issueCreated'
import { fireIssueUpdated } from './events/issueUpdated'
import { handleOauth } from './misc/linear'
import { getUserAndConversation } from './misc/utils'
import { secrets } from '.botpress'

export const handler: IntegrationProps['handler'] = async ({ req, ctx, client }) => {
  if (req.path === '/oauth') {
    return handleOauth(req, client, ctx)
  }

  if (!req.body) {
    return
  }

  const linearEvent = JSON.parse(req.body)
  const {
    state: { payload },
  } = await client.getState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
  })

  const webhookSignatureHeader = req.headers[LINEAR_WEBHOOK_SIGNATURE_HEADER]
  if (!webhookSignatureHeader) {
    return
  }

  // Verify the request, it will throw an error in case of not coming from linear
  const webhook = new LinearWebhooks(secrets.WEBHOOK_SIGNING_SECRET)
  // are we sure it throws? it returns a boolean , add char to test this
  webhook.verify(Buffer.from(req.body), webhookSignatureHeader, linearEvent[LINEAR_WEBHOOK_TS_FIELD])

  console.info('linearEvent', linearEvent)

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

  if (linearEvent.data.userId === payload.botUserId || linearEvent.data.user?.id === payload.botUserId) {
    // this means the message is actually coming from the bot itself, so we don't want to process it
    return
  }

  // TODO: We're assuming that the bot on Linear uses a dedicated account, not impersonating a real user
  if (eventType === 'comment' && linearEvent.action === 'create') {
    const linearCommentId = linearEvent.data.id
    const userId = linearEvent.data.user.id
    const issueConversationId = linearEvent.data.issue.id
    const content = linearEvent.data.body
    // const channelType = 'issue' // TODO: check if replying in a thread

    await client.createMessage({
      tags: { id: linearCommentId },
      type: 'text',
      payload: { text: content },
      ...(await getUserAndConversation(
        {
          linearIssueId: issueConversationId,
          linearUserId: userId,
        },
        client
      )),
    })
  }

  return

  // //
  // // ===== COMMENTS ===== //
  // //

  // if (!userId) {
  //   throw new Error('Handler received an empty user id')
  // }

  // if (!conversationId) {
  //   throw new Error('Handler received an empty issue id')
  // }

  // const messageId = linearEvent.data.id

  // if (!messageId) {
  //   throw new Error('Handler received an empty message id')
  // }

  // TODO: check and re-add this
}
