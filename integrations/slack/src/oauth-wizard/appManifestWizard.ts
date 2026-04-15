import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { RuntimeError, Response, z } from '@botpress/sdk'
import {
  SlackManifestClient,
  buildSlackAppManifest,
  patchAppManifestConfigurationState,
  getAppManifestConfigurationState,
} from '../slack-api/slack-manifest-client'
import { handleOAuthCallback } from '../webhook-events/handlers/oauth-callback'
import * as bp from '.botpress'

type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>

const _manifestConfigSchema = z.object({
  appConfigurationRefreshToken: z
    .string()
    .secret()
    .title('Slack App Configuration Refresh Token')
    .describe('Generated from api.slack.com/apps'),
  appName: z
    .string()
    .max(35)
    .optional()
    .title('Slack App Name')
    .describe('Choose a name for the Slack app (max 35 characters)'),
})

export const handler = async (props: bp.HandlerProps): Promise<Response> => {
  const wizard = new oauthWizard.OAuthWizardBuilder(props)
    .addStep({ id: 'start', handler: _startHandler })
    .addStep({ id: 'get-config', handler: _getConfigHandler })
    .addStep({ id: 'save-config', handler: _saveConfigHandler })
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
      { action: 'navigate', label: 'Continue', navigateToStep: 'get-config', buttonType: 'primary' },
      { action: 'close', label: 'Cancel', buttonType: 'secondary' },
    ],
  })
}

const _getConfigHandler: WizardHandler = ({ responses }) => {
  return responses.displayForm({
    pageTitle: 'Slack App Configuration',
    htmlOrMarkdownPageContents:
      'Enter your Slack App Configuration Refresh Token and a name for your app.<br>' +
      'You can generate tokens at <a href="https://api.slack.com/apps" target="_blank">api.slack.com/apps</a>.',
    schema: _manifestConfigSchema,
    nextStepId: 'save-config',
  })
}

const _saveConfigHandler: WizardHandler = async ({ client, ctx, responses, formValues }) => {
  if (!formValues) {
    return responses.redirectToStep('get-config')
  }

  const parsed = _manifestConfigSchema.safeParse(formValues)
  if (!parsed.success) {
    return responses.displayForm({
      pageTitle: 'Slack App Configuration',
      htmlOrMarkdownPageContents: 'Some fields are invalid. Please correct them and try again.',
      schema: _manifestConfigSchema,
      nextStepId: 'save-config',
      errors: parsed.error,
      previousValues: formValues as z.input<typeof _manifestConfigSchema>,
    })
  }

  await patchAppManifestConfigurationState(client, ctx, {
    appConfigurationRefreshToken: parsed.data.appConfigurationRefreshToken,
    appName: parsed.data.appName,
  })

  return responses.redirectToStep('create-app')
}

const _createAppHandler: WizardHandler = async (props) => {
  const { client, ctx, responses, logger } = props

  const manifestState = await getAppManifestConfigurationState(client, ctx)

  if (!manifestState.appConfigurationRefreshToken) {
    throw new RuntimeError('Slack App Configuration Refresh Token is required. Please restart the wizard.')
  }
  const appName = manifestState.appName || 'Botpress Bot'

  const webhookUrl = `${process.env.BP_WEBHOOK_URL!}/${props.ctx.webhookId}`
  const redirectUri = `${process.env.BP_WEBHOOK_URL!}/oauth`
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
  const oauthCallbackUrl = oauthWizard.getWizardStepUrl('oauth-callback').toString()
  authorizeUrl.searchParams.set('redirect_uri', oauthCallbackUrl)
  authorizeUrl.searchParams.set('state', ctx.webhookId)

  await patchAppManifestConfigurationState(client, ctx, {
    appId: app_id,
    clientId: credentials.client_id,
    clientSecret: credentials.client_secret,
    signingSecret: credentials.signing_secret,
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
