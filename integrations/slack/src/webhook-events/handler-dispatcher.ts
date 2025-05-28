import * as sdk from '@botpress/sdk'
import type { SlackEvent } from '@slack/types'
import * as handlers from './handlers'
import { handleInteractiveRequest, isInteractiveRequest } from './handlers/interactive-request'
import { isOAuthCallback, handleOAuthCallback } from './handlers/oauth-callback'
import { isUrlVerificationRequest, handleUrlVerificationRequest } from './handlers/url-verification'
import { SlackEventSignatureValidator } from './signature-validator'
import * as bp from '.botpress'

export const handler: bp.IntegrationProps['handler'] = async ({ req, ctx, client, logger }) => {
  logger.forBot().debug('Handler received request from Slack with payload:', req.body)

  if (isOAuthCallback(req)) {
    return await handleOAuthCallback({ req, client, logger, ctx })
  }

  _verifyBodyIsPresent(req)

  const data = JSON.parse(req.body)

  if (isUrlVerificationRequest(data)) {
    logger.forBot().debug('Handler received request of type url_verification')
    return handleUrlVerificationRequest(data)
  }

  await _verifyMessageIsProperlyAuthenticated({ req, client, logger, ctx })

  if (isInteractiveRequest(req)) {
    return await handleInteractiveRequest({ req, client, logger, ctx })
  }

  const event: SlackEvent = data.event
  logger.forBot().debug(`Handler received request of type ${data.event.type}`)

  if (await _isEventProducedByBot({ client, ctx }, event)) {
    logger.forBot().debug('Ignoring event produced by the bot itself')
    return
  }

  await _dispatchEvent({ client, ctx, logger, req }, event)
}

function _verifyBodyIsPresent(req: sdk.Request): asserts req is sdk.Request & { body: string } {
  if (!req.body) {
    throw new sdk.RuntimeError('Handler received a request with an empty body')
  }
}

const _verifyMessageIsProperlyAuthenticated = async ({ req, logger, ctx }: bp.HandlerProps) => {
  const signingSecret = _getSigningSecret(ctx)
  const isSignatureValid = new SlackEventSignatureValidator(signingSecret, req, logger).isEventProperlyAuthenticated()

  if (!isSignatureValid) {
    throw new sdk.RuntimeError('Handler received a request with an invalid signature')
  }
}

const _isEventProducedByBot = async (
  { client, ctx }: { client: bp.Client; ctx: bp.Context },
  event: SlackEvent
): Promise<boolean> => {
  if ('bot_id' in event && event.bot_id) {
    return true
  }

  return (
    'user' in event &&
    event.user ===
      (await client.getState({ type: 'integration', name: 'oAuthCredentialsV2', id: ctx.integrationId })).state.payload
        .botUserId
  )
}

const _dispatchEvent = async ({ client, ctx, logger }: bp.HandlerProps, slackEvent: SlackEvent) => {
  switch (slackEvent.type) {
    case 'message':
      return await handlers.messageReceived.handleEvent({ slackEvent, client, ctx, logger })

    case 'reaction_added':
      return await handlers.reactionAdded.handleEvent({ slackEvent, client })

    case 'reaction_removed':
      return await handlers.reactionRemoved.handleEvent({ slackEvent, client })

    case 'team_join':
      return await handlers.memberJoinedWorkspace.handleEvent({ slackEvent, client })

    case 'member_joined_channel':
      return await handlers.memberJoinedChannel.handleEvent({ slackEvent, client })

    case 'member_left_channel':
      return await handlers.memberLeftChannel.handleEvent({ slackEvent, client })

    case 'function_executed':
      return await handlers.functionExecuted.handleEvent({ slackEvent, client, logger })

    default:
      logger.forBot().debug(`Ignoring unsupported event type ${slackEvent.type}`)
      return
  }
}

const _getSigningSecret = (ctx: bp.Context) =>
  ctx.configurationType === 'refreshToken' ? ctx.configuration.signingSecret : bp.secrets.SIGNING_SECRET
