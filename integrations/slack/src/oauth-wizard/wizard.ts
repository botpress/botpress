import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { RuntimeError, Response } from '@botpress/sdk'
import { SlackManifestClient, buildSlackAppManifest } from '../slack-api/slack-manifest-client'
import { SlackOAuthClient } from '../slack-api/slack-oauth-client'
import * as bp from '.botpress'

type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>

export const handler = async (props: bp.HandlerProps): Promise<Response> => {
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

const _saveAppNameHandler: WizardHandler = async ({ client, ctx, responses, inputValue }) => {
  if (!inputValue?.trim()) {
    throw new RuntimeError('App name is required')
  }
  await _patchAppManifestConfigurationState(client, ctx, { appName: inputValue.trim() })

  return responses.redirectToStep('create-app')
}

const _createAppHandler: WizardHandler = async (props) => {
  const { client, ctx, responses, logger } = props

  if (ctx.configurationType !== 'manifestAppCredentials') {
    throw new RuntimeError('This wizard is only available for the App Manifest configuration type')
  }

  const appConfigurationToken = ctx.configuration.appConfigurationToken
  if (!appConfigurationToken) {
    throw new RuntimeError('Slack App Configuration Token is required in the integration configuration')
  }

  const manifestState = await _getAppManifestConfigurationState(client, ctx)
  const appName = manifestState.appName || 'Botpress Bot'

  const webhookUrl = process.env.BP_WEBHOOK_URL!
  const redirectUri = oauthWizard.getWizardStepUrl('oauth-callback', ctx).toString()
  const manifest = buildSlackAppManifest(webhookUrl, redirectUri, appName)
  const manifestClient = new SlackManifestClient({ client, ctx, logger, appConfigurationToken })

  logger.forBot().debug('Validating Slack app manifest...')
  await manifestClient.validateManifest(manifest)

  logger.forBot().debug('Creating Slack app from manifest...')
  const {
    app_id,
    credentials: { client_id, client_secret, signing_secret },
  } = await manifestClient.createApp(manifest)

  await _patchAppManifestConfigurationState(client, ctx, {
    appConfigurationToken,
    appId: app_id,
    clientId: client_id,
    clientSecret: client_secret,
    signingSecret: signing_secret,
  })

  const scopes = manifest.oauth_config.scopes.bot.join(',')
  const oauthUrl =
    'https://slack.com/oauth/v2/authorize' +
    `?client_id=${encodeURIComponent(client_id)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(ctx.webhookId)}`

  return responses.redirectToExternalUrl(oauthUrl)
}

const _oauthCallbackHandler: WizardHandler = async (props) => {
  props.logger.forBot().debug('Handling OAuth callback with query parameters', { query: props.query })
  const { client, ctx, logger, responses, query } = props
  const code = query.get('code')

  if (!code) {
    const error = query.get('error') || 'No authorization code received'
    return responses.endWizard({
      success: false,
      errorMessage: `Slack OAuth failed: ${error}`,
    })
  }

  const state = await _getAppManifestConfigurationState(client, ctx)
  if (!state.clientId || !state.clientSecret) {
    return responses.endWizard({
      success: false,
      errorMessage: 'App credentials not found. Please restart the wizard.',
    })
  }

  const redirectUri = oauthWizard.getWizardStepUrl('oauth-callback', ctx).toString()
  const oauthClient = new SlackOAuthClient({
    client,
    ctx,
    logger,
    clientIdOverride: state.clientId,
    clientSecretOverride: state.clientSecret,
  })

  try {
    await oauthClient.requestShortLivedCredentials.fromAuthorizationCode(code, redirectUri)
    const { teamId } = await oauthClient.getAuthState()
    await client.configureIntegration({ identifier: teamId })
  } catch (error) {
    logger.forBot().error('Failed to exchange authorization code', error)
    return responses.endWizard({
      success: false,
      errorMessage: `Failed to exchange authorization code: ${error instanceof Error ? error.message : String(error)}`,
    })
  }

  return responses.redirectToStep('end')
}

const _endHandler: WizardHandler = ({ responses }) => {
  return responses.endWizard({ success: true })
}

const _patchAppManifestConfigurationState = async (
  client: bp.Client,
  ctx: bp.Context,
  newState: Partial<bp.states.manifestAppCredentials.ManifestAppCredentials['payload']>
) => {
  const currentState = await _getAppManifestConfigurationState(client, ctx)
  await client.setState({
    type: 'integration',
    id: ctx.integrationId,
    name: 'manifestAppCredentials',
    payload: { ...currentState, ...newState },
  })
}

const _getAppManifestConfigurationState = async (
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
  } catch (error) {
    throw new RuntimeError(
      `Failed to get manifest app credentials state: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
