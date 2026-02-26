import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import * as sdk from '@botpress/sdk'
import { WebClient as SlackWebClient } from '@slack/web-api'
import {
  SlackManifestClient,
  buildSlackAppManifest,
  type ManifestCreateResponse,
} from '../slack-api/slack-manifest-client'
import * as bp from '.botpress'

const oauthResponseSchema = sdk.z.object({
  ok: sdk.z.literal(true),
  access_token: sdk.z.string(),
  refresh_token: sdk.z.string(),
  expires_in: sdk.z.number().positive(),
  scope: sdk.z.string(),
  bot_user_id: sdk.z.string(),
  team: sdk.z.object({
    id: sdk.z.string(),
  }),
})

type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>

export const handler = async (props: bp.HandlerProps): Promise<sdk.Response> => {
  const wizard = new oauthWizard.OAuthWizardBuilder(props)
    .addStep({ id: 'start', handler: _startHandler })
    .addStep({ id: 'get-app-name', handler: _getAppNameHandler })
    .addStep({ id: 'save-app-name', handler: _saveAppNameHandler })
    .addStep({ id: 'create-app', handler: _createAppHandler })
    .addStep({ id: 'oauth-callback', handler: _oauthCallbackHandler })
    .addStep({ id: 'end', handler: _endHandler })
    .build()

  return await wizard.handleRequest()
}

const _startHandler: WizardHandler = (props) => {
  return props.responses.displayButtons({
    pageTitle: 'Slack App Setup',
    htmlOrMarkdownPageContents:
      'This wizard will create a dedicated Slack app for your bot using the Slack App Manifest API.<br><br>' +
      'A Slack app will be automatically created and configured with all the required permissions and settings.',
    buttons: [
      { action: 'navigate', label: 'Continue', navigateToStep: 'get-app-name', buttonType: 'primary' },
      { action: 'close', label: 'Cancel', buttonType: 'secondary' },
    ],
  })
}

const _getAppNameHandler: WizardHandler = (props) => {
  return props.responses.displayInput({
    pageTitle: 'Name Your Slack App',
    htmlOrMarkdownPageContents: 'Choose a name for the Slack app that will be created (max 35 characters).',
    input: { label: 'e.g. My Botpress Bot', type: 'text' },
    nextStepId: 'save-app-name',
  })
}

const _saveAppNameHandler: WizardHandler = async (props) => {
  const { client, ctx, responses, inputValue } = props

  if (!inputValue?.trim()) {
    throw new sdk.RuntimeError('App name is required')
  }

  await _patchManifestState(client, ctx, { appName: inputValue.trim() })

  return responses.redirectToStep('create-app')
}

const _createAppHandler: WizardHandler = async (props) => {
  const { client, ctx, responses, logger } = props

  if (ctx.configurationType !== 'manifestAppCredentials') {
    throw new sdk.RuntimeError('This wizard is only available for the App Manifest configuration type')
  }

  const configToken = ctx.configuration.appConfigurationToken
  if (!configToken) {
    throw new sdk.RuntimeError('Slack App Configuration Token is required in the integration configuration')
  }

  const manifestState = await _getManifestState(client, ctx)
  const appName = manifestState.appName || 'Botpress Bot'

  const webhookUrl = process.env.BP_WEBHOOK_URL!
  const redirectUri = oauthWizard.getWizardStepUrl('oauth-callback', ctx).toString()
  const manifest = buildSlackAppManifest(webhookUrl, redirectUri, appName)
  const manifestClient = new SlackManifestClient({ client, ctx, logger, configToken })

  logger.forBot().debug('Validating Slack app manifest...')
  const validation = await manifestClient.validateManifest(manifest)
  if (!validation.ok) {
    return responses.endWizard({
      success: false,
      errorMessage: `Manifest validation failed: ${validation.errorMessage}`,
    })
  }

  logger.forBot().debug('Creating Slack app from manifest...')
  const result: ManifestCreateResponse = await manifestClient.createApp(manifest)

  await _patchManifestState(client, ctx, {
    configToken,
    appId: result.app_id,
    clientId: result.credentials.client_id,
    clientSecret: result.credentials.client_secret,
    signingSecret: result.credentials.signing_secret,
  })

  const scopes = manifest.oauth_config.scopes.bot.join(',')
  const oauthUrl =
    'https://slack.com/oauth/v2/authorize' +
    `?client_id=${encodeURIComponent(result.credentials.client_id)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(ctx.webhookId)}`

  return responses.redirectToExternalUrl(oauthUrl)
}

const _oauthCallbackHandler: WizardHandler = async (props) => {
  const { client, ctx, logger, responses, query } = props
  const code = query.get('code')

  if (!code) {
    const error = query.get('error') || 'No authorization code received'
    return responses.endWizard({
      success: false,
      errorMessage: `Slack OAuth failed: ${error}`,
    })
  }

  const manifestCreds = await _getManifestState(client, ctx)
  if (!manifestCreds.clientId || !manifestCreds.clientSecret) {
    return responses.endWizard({
      success: false,
      errorMessage: 'App credentials not found. Please restart the wizard.',
    })
  }

  logger.forBot().debug('Exchanging authorization code for credentials...')
  const redirectUri = oauthWizard.getWizardStepUrl('oauth-callback', ctx).toString()
  const slackClient = new SlackWebClient()
  const rawResponse = await slackClient.oauth.v2.access({
    client_id: manifestCreds.clientId,
    client_secret: manifestCreds.clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    code,
  })

  const parseResult = oauthResponseSchema.safeParse(rawResponse)
  if (!parseResult.success) {
    logger.forBot().error('OAuth response validation failed', parseResult.error.flatten())
    return responses.endWizard({
      success: false,
      errorMessage: 'Failed to exchange authorization code: unexpected response from Slack',
    })
  }

  const oauthResponse = parseResult.data
  const issuedAt = new Date()
  const expiresAt = new Date(issuedAt.getTime() + oauthResponse.expires_in * 1000)

  await client.setState({
    type: 'integration',
    id: ctx.integrationId,
    name: 'oAuthCredentialsV2',
    payload: {
      shortLivedAccessToken: {
        currentAccessToken: oauthResponse.access_token,
        issuedAt: issuedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
      rotatingRefreshToken: {
        token: oauthResponse.refresh_token,
        issuedAt: issuedAt.toISOString(),
      },
      grantedScopes: oauthResponse.scope.split(','),
      botUserId: oauthResponse.bot_user_id,
      teamId: oauthResponse.team.id,
    },
  })

  await client.configureIntegration({ identifier: oauthResponse.team.id })

  return responses.redirectToStep('end')
}

const _endHandler: WizardHandler = ({ responses }) => {
  return responses.endWizard({ success: true })
}

const _patchManifestState = async (
  client: bp.Client,
  ctx: bp.Context,
  newState: Partial<bp.states.manifestAppCredentials.ManifestAppCredentials['payload']>
) => {
  const currentState = await _getManifestState(client, ctx)
  await client.setState({
    type: 'integration',
    id: ctx.integrationId,
    name: 'manifestAppCredentials',
    payload: { ...currentState, ...newState },
  })
}

const _getManifestState = async (
  client: bp.Client,
  ctx: bp.Context
): Promise<Partial<bp.states.manifestAppCredentials.ManifestAppCredentials['payload']>> => {
  try {
    const { state } = await client.getState({
      type: 'integration',
      name: 'manifestAppCredentials',
      id: ctx.integrationId,
    })
    return state.payload
  } catch {
    return {}
  }
}
