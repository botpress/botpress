import { Request } from '@botpress/sdk'
import { LinearWebhooks } from '@linear/sdk'

import { fireIssueCreated } from './events/issueCreated'
import { fireIssueDeleted } from './events/issueDeleted'
import { fireIssueUpdated } from './events/issueUpdated'
import { LinearEvent, handleOauth } from './misc/linear'
import { Result } from './misc/types'
import { getLinearClient, getUserAndConversation } from './misc/utils'
import * as bp from '.botpress'

const LINEAR_WEBHOOK_SIGNATURE_HEADER = 'linear-signature'
const LINEAR_WEBHOOK_TS_FIELD = 'webhookTimestamp'

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

  const result = _safeCheckWebhookSignature({ req, linearEvent, ctx })
  if (!result.success) {
    const message = `Error while verifying webhook signature: ${result.message}`
    logger.forBot().error(message)
    throw new Error(message)
  }

  const linearBotId = await _getLinearBotId({ client, ctx })
  if (linearEvent.data.userId === linearBotId || linearEvent.data.user?.id === linearBotId) {
    logger.forBot().debug('Received a webhook event from the bot itself, skipping...')
    return
  }

  // ============ EVENTS ==============
  if (linearEvent.type === 'issue' && (linearEvent.action === 'create' || linearEvent.action === 'restore')) {
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

  if (
    linearEvent.type === 'comment' &&
    linearEvent.action === 'create' &&
    // Comment can be added in projects which are not issues. Therefore they don't have issueId or
    // issue.id. Comments in projects are currently ignored.
    (linearEvent.data.issue || linearEvent.data.issueId)
  ) {
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

const _safeCheckWebhookSignature = ({
  req,
  linearEvent,
  ctx,
}: {
  req: Request
  linearEvent: LinearEvent
  ctx: bp.Context
}): Result<undefined> => {
  const webhookSignatureHeader = req.headers[LINEAR_WEBHOOK_SIGNATURE_HEADER]

  if (!webhookSignatureHeader || !req.body) {
    return { success: false, message: 'missing signature header or request body' }
  }

  const webhookHandler = new LinearWebhooks(_getWebhookSigningSecret({ ctx }))
  const bodyBuffer = Buffer.from(req.body)
  const timeStampHeader = linearEvent[LINEAR_WEBHOOK_TS_FIELD]
  try {
    const result = webhookHandler.verify(bodyBuffer, webhookSignatureHeader, timeStampHeader)
    if (result) {
      return { success: true, result: undefined }
    }
    return { success: false, message: 'webhook signature verification failed' }
  } catch (thrown) {
    const errorMessage = thrown instanceof Error ? thrown.message : String(thrown)
    return {
      success: false,
      message: `Webhook signature verification failed: ${errorMessage}`,
    }
  }
}

const _getWebhookSigningSecret = ({ ctx }: { ctx: bp.Context }) =>
  ctx.configurationType === 'apiKey' ? ctx.configuration.webhookSigningSecret : bp.secrets.WEBHOOK_SIGNING_SECRET

const _getLinearBotId = async ({ client, ctx }: { client: bp.Client; ctx: bp.Context }) => {
  const linearClient = await getLinearClient({ client, ctx }, ctx.integrationId)
  const me = await linearClient.viewer
  return me.id
}
