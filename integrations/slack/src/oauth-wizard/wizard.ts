import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { RuntimeError, Response } from '@botpress/sdk'
import { handleOAuthCallback } from 'src/webhook-events/handlers/oauth-callback'
import {
  SlackManifestClient,
  buildSlackAppManifest,
  patchAppManifestConfigurationState,
  getAppManifestConfigurationState,
} from '../slack-api/slack-manifest-client'
import * as bp from '.botpress'

type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>

export const handler = async (props: bp.HandlerProps): Promise<Response> => {
  const wizard = new oauthWizard.OAuthWizardBuilder(props)
    .addStep({ id: 'start', handler: _startHandler })
    .addStep({ id: 'get-config-token', handler: _getConfigTokenHandler })
    .addStep({ id: 'save-config-token', handler: _saveConfigTokenHandler })
    .addStep({ id: 'get-config-refresh-token', handler: _getConfigRefreshTokenHandler })
    .addStep({ id: 'save-config-refresh-token', handler: _saveConfigRefreshTokenHandler })
    .addStep({ id: 'get-app-name', handler: _getAppNameHandler })
    .addStep({ id: 'save-app-name', handler: _saveAppNameHandler })
    .addStep({ id: 'create-app', handler: _createAppHandler })
    .addStep({ id: 'oauth-callback', handler: _oauthCallbackHandler })
    .addStep({ id: 'end', handler: _endHandler })
    .build()

  return await wizard.handleRequest()
}

const _startHandler: WizardHandler = async ({ client, ctx, responses }) => {
  const { appId, clientId, clientSecret, authorizeUrl } = await getAppManifestConfigurationState(client, ctx)

  if (appId && clientId && clientSecret && authorizeUrl) {
    return responses.redirectToExternalUrl(authorizeUrl)
  }

  return responses.displayButtons({
    pageTitle: 'Slack App Setup',
    htmlOrMarkdownPageContents:
      'This wizard will create a dedicated Slack app for your bot using the Slack App Manifest API.<br><br>' +
      'A Slack app will be automatically created and configured with all the required permissions and settings.',
    buttons: [
      { action: 'navigate', label: 'Continue', navigateToStep: 'get-config-token', buttonType: 'primary' },
      { action: 'close', label: 'Cancel', buttonType: 'secondary' },
    ],
  })
}

const _getConfigTokenHandler: WizardHandler = async ({ client, ctx, responses }) => {
  const state = await getAppManifestConfigurationState(client, ctx)
  if (state.appConfigurationToken && state.appConfigurationRefreshToken) {
    return responses.redirectToStep('get-app-name')
  }

  return responses.displayInput({
    pageTitle: 'Slack App Configuration Token',
    htmlOrMarkdownPageContents:
      'Enter your Slack App Configuration Token.<br>You can generate one at <a href="https://api.slack.com/apps" target="_blank">api.slack.com/apps</a>.',
    input: { label: 'App Configuration Token', type: 'text' },
    nextStepId: 'save-config-token',
  })
}

const _saveConfigTokenHandler: WizardHandler = async ({ client, ctx, responses, inputValue }) => {
  if (!inputValue?.trim()) {
    throw new RuntimeError('App Configuration Token is required')
  }
  await patchAppManifestConfigurationState(client, ctx, { appConfigurationToken: inputValue.trim() })
  return responses.redirectToStep('get-config-refresh-token')
}

const _getConfigRefreshTokenHandler: WizardHandler = (props) => {
  return props.responses.displayInput({
    pageTitle: 'Slack App Configuration Refresh Token',
    htmlOrMarkdownPageContents:
      'Enter your Slack App Configuration Refresh Token.<br>You can generate one at <a href="https://api.slack.com/apps" target="_blank">api.slack.com/apps</a>.',
    input: { label: 'App Configuration Refresh Token', type: 'text' },
    nextStepId: 'save-config-refresh-token',
  })
}

const _saveConfigRefreshTokenHandler: WizardHandler = async ({ client, ctx, responses, inputValue }) => {
  if (!inputValue?.trim()) {
    throw new RuntimeError('App Configuration Refresh Token is required')
  }
  await patchAppManifestConfigurationState(client, ctx, { appConfigurationRefreshToken: inputValue.trim() })
  return responses.redirectToStep('get-app-name')
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
  await patchAppManifestConfigurationState(client, ctx, { appName: inputValue.trim() })

  return responses.redirectToStep('create-app')
}

const _createAppHandler: WizardHandler = async (props) => {
  const { client, ctx, responses, logger } = props

  if (ctx.configurationType !== 'manifestAppCredentials') {
    throw new RuntimeError('This wizard is only available for the App Manifest configuration type')
  }

  const manifestState = await getAppManifestConfigurationState(client, ctx)

  if (!manifestState.appConfigurationToken || !manifestState.appConfigurationRefreshToken) {
    throw new RuntimeError('Slack App Configuration Token and Refresh Token are required. Please restart the wizard.')
  }
  const appName = manifestState.appName || 'Botpress Bot'

  const webhookUrl = process.env.BP_WEBHOOK_URL!
  const redirectUri = `${webhookUrl}/oauth`
  const manifest = buildSlackAppManifest(webhookUrl, redirectUri, appName)
  const manifestClient = await SlackManifestClient.create({
    client,
    ctx,
    logger,
  })

  logger.forBot().debug('Validating Slack app manifest...')
  await manifestClient.validateManifest(manifest)

  logger.forBot().debug('Creating Slack app from manifest...')
  const { app_id, credentials, oauth_authorize_url } = await manifestClient.createApp(manifest)
  const authorizeUrl = new URL(oauth_authorize_url)
  const oauthCallbackUrl = oauthWizard.getWizardStepUrl('oauth-callback').toString() //`${redirectUri}?state=${ctx.webhookId}`
  authorizeUrl.searchParams.set('redirect_uri', oauthCallbackUrl)
  authorizeUrl.searchParams.set('state', ctx.webhookId)

  await patchAppManifestConfigurationState(client, ctx, {
    appId: app_id,
    clientId: credentials.client_id,
    clientSecret: credentials.client_secret,
    authorizeUrl: authorizeUrl.toString(),
  })
  return responses.redirectToExternalUrl(authorizeUrl.toString())
}

const _oauthCallbackHandler: WizardHandler = async ({ req, client, ctx, logger, responses }) => {
  await handleOAuthCallback({ req, client, ctx, logger })

  return responses.redirectToStep('end')
}

const _endHandler: WizardHandler = ({ responses }) => {
  return responses.endWizard({ success: true })
}
