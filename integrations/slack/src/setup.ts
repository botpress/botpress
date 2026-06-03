import { RuntimeError } from '@botpress/sdk'
import { isValidUrl } from './misc/utils'
import { SlackClient } from './slack-api'
import type * as bp from '.botpress'

export const REQUIRED_SLACK_SCOPES = [
  'channels:history',
  'channels:manage',
  'channels:read',
  'chat:write',
  'files:read',
  'files:write',
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
  'users:read.email',
]

export const register: bp.IntegrationProps['register'] = async ({ client, ctx, logger }) => {
  logger.forBot().debug('Registering Slack integration')

  await _updateBotpressBotNameAndAvatar({ client, ctx, logger })

  const slackClient = await SlackClient.createFromStates({ client, ctx, logger })

  await slackClient.testAuthentication()

  const hasRequiredScopes = slackClient.hasAllScopes(REQUIRED_SLACK_SCOPES)

  if (!hasRequiredScopes) {
    const grantedScopes = slackClient.getGrantedScopes()
    const missingScopes = REQUIRED_SLACK_SCOPES.filter((scope) => !grantedScopes.includes(scope))

    throw new RuntimeError(
      'The Slack access token is missing required scopes. Please re-authorize the app.\n\n' +
        `Missing scopes: ${missingScopes.join(', ')}.\n` +
        `Granted scopes: ${grantedScopes.join(', ')}.`
    )
  }
}

const _updateBotpressBotNameAndAvatar = async ({ client, ctx, logger }: bp.CommonHandlerProps) => {
  const { botAvatarUrl } = ctx.configuration

  const isUrlValid = botAvatarUrl && isValidUrl(botAvatarUrl)
  if (!isUrlValid) {
    logger.forBot().warn('The provided bot avatar URL is invalid. Skipping avatar picture update.')
  }

  await client.updateUser({
    id: ctx.botUserId,
    pictureUrl: isUrlValid ? botAvatarUrl.trim() : undefined,
    name: ctx.configuration.botName?.trim(),
  })
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {
  // nothing to unregister
}
