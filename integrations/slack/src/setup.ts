import { RuntimeError } from '@botpress/client'
import { isValidUrl } from './misc/utils'
import { SlackClient } from './slack-api'
import * as bp from '.botpress'

const REQUIRED_SLACK_SCOPES = [
  'channels:history',
  'channels:manage',
  'channels:read',
  'chat:write',
  'groups:history',
  'groups:read',
  'groups:write',
  'im:history',
  'im:read',
  'im:write',
  'mpim:history',
  'mpim:read',
  'mpim:write',
  'reactions:read',
  'reactions:write',
  'team:read',
  'users.profile:read',
  'users:read',
]

export const register: bp.IntegrationProps['register'] = async ({ client, ctx, logger }) => {
  logger.forBot().debug('Registering Slack integration')

  await _updateBotpressBotNameAndAvatar(client, ctx)

  let slackClient: SlackClient

  if (ctx.configurationType === 'refreshToken') {
    if (
      !ctx.configuration.refreshToken ||
      !ctx.configuration.signingSecret ||
      !ctx.configuration.clientId ||
      !ctx.configuration.clientSecret
    ) {
      throw new RuntimeError(
        'Missing configuration: Refresh Token, Signing Secret, Client ID, and Client Secret are all required when using manual configuration'
      )
    }

    const originalRefreshToken = await _getPreviouslyRegisteredToken(client, ctx)

    if (originalRefreshToken === ctx.configuration.refreshToken) {
      // The user registered the integration with the same refresh token as before,
      // so we don't need to update anything. This can happen when the user
      // merely updates to the latest version of the integration.
      logger.forBot().debug('No change in refresh token, skipping authentication')
      return
    }

    slackClient = await SlackClient.createFromRefreshToken({
      client,
      ctx,
      logger,
      refreshToken: ctx.configuration.refreshToken,
    })
    await _saveOriginalRefreshToken(client, ctx, ctx.configuration.refreshToken)
  } else {
    slackClient = await SlackClient.createFromStates({ client, ctx, logger })
  }

  await slackClient.testAuthentication()

  const hasRequiredScopes = slackClient.hasAllScopes(REQUIRED_SLACK_SCOPES)

  if (!hasRequiredScopes) {
    throw new RuntimeError(
      `Missing required scopes: ${REQUIRED_SLACK_SCOPES.join(', ')}. Please reauthorize the app with the required scopes.`
    )
  }
}

const _updateBotpressBotNameAndAvatar = async (client: bp.Client, ctx: bp.Context) => {
  const { botAvatarUrl } = ctx.configuration

  await client.updateUser({
    id: ctx.botUserId,
    pictureUrl: botAvatarUrl && isValidUrl(botAvatarUrl) ? botAvatarUrl.trim() : undefined,
    name: ctx.configuration.botName?.trim(),
  })
}

const _getPreviouslyRegisteredToken = async (client: bp.Client, ctx: bp.Context) => {
  try {
    const { state } = await client.getState({
      type: 'integration',
      name: 'oAuthCredentialsV2',
      id: ctx.integrationId,
    })

    return state.payload.originalRefreshToken
  } catch {}
  return
}

const _saveOriginalRefreshToken = async (client: bp.Client, ctx: bp.Context, refreshToken: string) => {
  const { state } = await client.getState({
    type: 'integration',
    name: 'oAuthCredentialsV2',
    id: ctx.integrationId,
  })

  await client.setState({
    type: 'integration',
    id: ctx.integrationId,
    name: 'oAuthCredentialsV2',
    payload: { ...state.payload, originalRefreshToken: refreshToken },
  })
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {
  // nothing to unregister
}
