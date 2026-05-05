import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { Response, z } from '@botpress/sdk'
import { REQUIRED_SLACK_SCOPES } from '../setup'
import { SlackManifestClient, buildSlackAppManifest, patchAppCredentials } from '../slack-api/slack-manifest-client'
import { handleOAuthCallback } from '../webhook-events/handlers/oauth-callback'
import * as bp from '.botpress'

type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>

const _buildSlackAuthorizeUrl = (clientId: string, webhookId: string): string => {
  const redirectUri = `${process.env.BP_WEBHOOK_URL}/oauth`
  const scopes = REQUIRED_SLACK_SCOPES.join(',')
  return `https://slack.com/oauth/v2/authorize?client_id=${encodeURIComponent(clientId)}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(webhookId)}`
}

const _manualCredentialsSchema = z.object({
  clientId: z.string().title('Slack Client ID').describe('Available in the app admin panel under Basic Info'),
  clientSecret: z
    .string()
    .secret()
    .title('Slack Client Secret')
    .describe('Available in the app admin panel under Basic Info'),
  signingSecret: z
    .string()
    .secret()
    .title('Slack Signing Secret')
    .describe('Available in the app admin panel under Basic Info'),
})

const _manifestConfigSchema = z.object({
  appConfigurationRefreshToken: z
    .string()
    .secret()
    .title('Slack App Configuration Refresh Token')
    .describe('Generated from api.slack.com/apps'),
  appName: z
    .string()
    .max(35, 'App name must be 35 characters or less')
    .title('Slack App Name')
    .describe('Choose a name for the Slack app (max 35 characters)'),
})

const _manualCredentialsForm = {
  pageTitle: 'Slack App Credentials',
  htmlOrMarkdownPageContents:
    'Enter your Slack app credentials.<br>' +
    'You can find these in the <a href="https://api.slack.com/apps" target="_blank">app admin panel</a> under each application\'s <strong>Basic Information</strong>.',
  schema: _manualCredentialsSchema,
  nextStepId: 'save-manual-credentials',
}

const _manifestConfigForm = {
  pageTitle: 'Slack App Configuration',
  htmlOrMarkdownPageContents:
    'Generate an App Configuration in the <a href="https://api.slack.com/apps" target="_blank">app admin panel</a>, near the bottom of the page.<br>' +
    'Enter your Slack App Configuration Refresh Token, and a name for your app.',
  schema: _manifestConfigSchema,
  nextStepId: 'create-app',
}

export const handler = async (props: bp.HandlerProps): Promise<Response> => {
  const wizard = new oauthWizard.OAuthWizardBuilder(props)
    .addStep({ id: 'start', handler: _startHandler })
    .addStep({ id: 'route-choice', handler: _routeChoiceHandler })
    .addStep({ id: 'oauth-redirect', handler: _oauthRedirectHandler })
    .addStep({ id: 'get-manual-credentials', handler: _getManualCredentialsHandler })
    .addStep({ id: 'save-manual-credentials', handler: _saveManualCredentialsHandler })
    .addStep({ id: 'get-manifest-config', handler: _getManifestConfigHandler })
    .addStep({ id: 'create-app', handler: _createAppHandler })
    .addStep({ id: 'oauth-callback', handler: _oauthCallbackHandler })
    .addStep({ id: 'end', handler: _endHandler })
    .build()

  return await wizard.handleRequest()
}

const _startHandler: WizardHandler = ({ responses }) => {
  return responses.displayChoices({
    pageTitle: 'Slack Integration Setup',
    htmlOrMarkdownPageContents: 'Choose how you would like to configure your Slack integration:',
    choices: [
      { label: 'Connect with OAuth', value: 'default' },
      { label: 'Configure a new Slack Application', value: 'manifest' },
      { label: 'Use existing Slack Application Credentials', value: 'manual' },
    ],
    nextStepId: 'route-choice',
  })
}

const _routeChoiceHandler: WizardHandler = ({ selectedChoice, responses }) => {
  switch (selectedChoice) {
    case 'manual':
      return responses.redirectToStep('get-manual-credentials')
    case 'manifest':
      return responses.redirectToStep('get-manifest-config')
    case 'default':
    default:
      return responses.redirectToStep('oauth-redirect')
  }
}

const _oauthRedirectHandler: WizardHandler = ({ ctx, responses }) => {
  return responses.redirectToExternalUrl(_buildSlackAuthorizeUrl(bp.secrets.CLIENT_ID, ctx.webhookId))
}

const _getManualCredentialsHandler: WizardHandler = ({ responses }) => {
  return responses.displayForm(_manualCredentialsForm)
}

const _saveManualCredentialsHandler: WizardHandler = async ({ ctx, client, responses, formValues }) => {
  if (!formValues) {
    return responses.redirectToStep('get-manual-credentials')
  }

  const parsed = _manualCredentialsSchema.safeParse(formValues)
  if (!parsed.success) {
    return responses.displayForm({
      ..._manualCredentialsForm,
      errors: parsed.error,
      previousValues: formValues as z.input<typeof _manualCredentialsSchema>,
    })
  }

  const { signingSecret, clientId, clientSecret } = parsed.data

  await patchAppCredentials(client, ctx, { signingSecret, clientId, clientSecret })

  return responses.redirectToExternalUrl(_buildSlackAuthorizeUrl(clientId, ctx.webhookId))
}
const _getManifestConfigHandler: WizardHandler = ({ responses }) => {
  return responses.displayForm(_manifestConfigForm)
}

const _createAppHandler: WizardHandler = async (props) => {
  const { client, ctx, responses, logger, formValues } = props

  if (!formValues) {
    return responses.redirectToStep('get-manifest-config')
  }

  const parsed = _manifestConfigSchema.safeParse(formValues)
  if (!parsed.success) {
    return responses.displayForm({
      ..._manifestConfigForm,
      errors: parsed.error,
      previousValues: formValues as z.input<typeof _manifestConfigSchema>,
    })
  }

  const { appConfigurationRefreshToken, appName } = parsed.data

  await patchAppCredentials(client, ctx, { appConfigurationRefreshToken })

  const webhookUrl = `${process.env.BP_WEBHOOK_URL!}/${ctx.webhookId}`
  const redirectUri = `${process.env.BP_WEBHOOK_URL!}/oauth`
  const manifest = buildSlackAppManifest(webhookUrl, redirectUri, appName)

  const manifestClient = await SlackManifestClient.create({ client, ctx, logger })

  logger.forBot().debug('Validating Slack app manifest...')
  await manifestClient.validateManifest(manifest)

  logger.forBot().debug('Creating Slack app from manifest...')
  const { credentials, oauth_authorize_url } = await manifestClient.createApp(manifest)

  await patchAppCredentials(client, ctx, {
    clientId: credentials.client_id,
    clientSecret: credentials.client_secret,
    signingSecret: credentials.signing_secret,
  })

  const authorizeUrl = new URL(oauth_authorize_url)
  authorizeUrl.searchParams.set('redirect_uri', redirectUri)
  authorizeUrl.searchParams.set('state', ctx.webhookId)

  return responses.redirectToExternalUrl(authorizeUrl.toString())
}

const _oauthCallbackHandler: WizardHandler = async ({ req, client, ctx, logger, responses }) => {
  await handleOAuthCallback({ req, client, ctx, logger })
  return responses.redirectToStep('end')
}

const _endHandler: WizardHandler = ({ responses }) => {
  return responses.endWizard({ success: true })
}
