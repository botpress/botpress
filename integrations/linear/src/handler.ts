import { Request } from '@botpress/sdk'
import { LinearWebhooks, LINEAR_WEBHOOK_SIGNATURE_HEADER, LINEAR_WEBHOOK_TS_FIELD } from '@linear/sdk'

import { fireIssueCreated } from './events/issueCreated'
import { fireIssueDeleted } from './events/issueDeleted'
import { fireIssueUpdated } from './events/issueUpdated'
import { LinearEvent, handleOauth } from './misc/linear'
import { getUserAndConversation } from './misc/utils'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async ({ req, ctx, client, logger }) => {
  if (req.path === '/oauth') {
    return handleOauth(req, client, ctx).catch((err) => {
      logger.forBot().error('Error while processing OAuth', err.response?.data || err.message)
      throw err
    })
  }

  if (!req.body) {
    return
  }

  const linearEvent: LinearEvent = JSON.parse(req.body)
  linearEvent.type = linearEvent.type.toLowerCase() as LinearEvent['type']

  if (!_isWebhookProperlyAuthenticated({ req, linearEvent, ctx })) {
    logger
      .forBot()
      .error(
        'Received a webhook event that is not properly authenticated. Please ensure the webhook signing secret is correct.'
      )
    throw new Error('Webhook event is not properly authenticated: the signing secret is invalid.')
  }

  // ============ EVENTS ==============
  if (linearEvent.type === 'issue' && linearEvent.action === 'create') {
    await fireIssueCreated({ linearEvent, client, ctx })
    return
  }

  if (linearEvent.type === 'issue' && linearEvent.action === 'update') {
    await fireIssueUpdated({ linearEvent, client, ctx })
    return
  }

  if (linearEvent.type === 'issue' && linearEvent.action === 'remove') {
    await fireIssueDeleted({ linearEvent, client, ctx })
    return
  }

  // ============ MESSAGES ==============

  const linearUserId = linearEvent.data.userId ?? linearEvent.data.user?.id
  if (!linearUserId) {
    // this means the message is actually coming from the bot itself, so we don't want to process it
    return
  }

  if (linearEvent.type === 'comment' && linearEvent.action === 'create') {
    const linearCommentId = linearEvent.data.id
    const issueConversationId = linearEvent.data.issueId || linearEvent.data.issue.id
    const content = linearEvent.data.body

    const { userId, conversationId } = await getUserAndConversation({
      linearIssueId: issueConversationId,
      linearUserId,
      integrationId: ctx.integrationId,
      client,
      ctx,
    })

    await client.createMessage({
      tags: { id: linearCommentId },
      type: 'text',
      payload: { text: content },
      conversationId,
      userId: userId as string, // TODO: fix this
    })
  }
}

const _isWebhookProperlyAuthenticated = ({
  req,
  linearEvent,
  ctx,
}: {
  req: Request
  linearEvent: LinearEvent
  ctx: bp.Context
}) => {
  const webhookSignatureHeader = req.headers[LINEAR_WEBHOOK_SIGNATURE_HEADER]

  if (!webhookSignatureHeader || !req.body) {
    return
  }

  const webhookHandler = new LinearWebhooks(_getWebhookSigningSecret({ ctx }))
  const bodyBuffer = Buffer.from(req.body)
  const timeStampHeader = linearEvent[LINEAR_WEBHOOK_TS_FIELD]

  return webhookHandler.verify(bodyBuffer, webhookSignatureHeader, timeStampHeader)
}

const _getWebhookSigningSecret = ({ ctx }: { ctx: bp.Context }) =>
  ctx.configurationType === 'apiKey' ? ctx.configuration.webhookSigningSecret : bp.secrets.WEBHOOK_SIGNING_SECRET
