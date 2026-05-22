import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { z } from '@botpress/sdk'
import axios from 'axios'
import { createOAuthMondayClient, createPersonalAccessTokenMondayClient } from 'src/misc/auth'
import * as bp from '.botpress'

type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>

type MondayOAuthTokenResponse = {
  access_token: string
  token_type: string
  scope: string
}

type MondayOAuthCredentials = {
  accessToken: string
  tokenType: 'Bearer'
  scope: string
}

const OAUTH_REDIRECT_URI = 'https://webhook.botpress.cloud/oauth/wizard/oauth-callback'
const INVALID_CREDENTIALS_MESSAGE =
  'Invalid Monday credentials. Please reconnect your account or provide a valid token.'

const _manualConfigurationSchema = z.object({
  personalAccessToken: z
    .string()
    .secret()
    .title('Personal Access Token')
    .describe('A Monday.com personal access token with access to the boards you want to manage.'),
})

const _manualConfigurationForm = {
  pageTitle: 'Manual Monday Configuration',
  htmlOrMarkdownPageContents:
    'Enter your Monday.com personal access token to configure this integration manually.<br>' +
    'You can create a token from the <a href="https://developer.monday.com/api-reference/docs/authentication#get-your-token" target="_blank">Monday authentication settings</a>.',
  schema: _manualConfigurationSchema,
  nextStepId: 'save-manual-configuration',
}

export const handler = async (props: bp.HandlerProps) => {
  const wizard = new oauthWizard.OAuthWizardBuilder(props)
    .addStep({ id: 'start', handler: _startHandler })
    .addStep({ id: 'route-choice', handler: _routeChoiceHandler })
    .addStep({ id: 'oauth-redirect', handler: _oauthRedirectHandler })
    .addStep({ id: 'oauth-callback', handler: _oauthCallbackHandler })
    .addStep({ id: 'manual-configuration', handler: _manualConfigurationHandler })
    .addStep({ id: 'save-manual-configuration', handler: _saveManualConfigurationHandler })
    .build()

  return await wizard.handleRequest()
}

const _startHandler: WizardHandler = ({ responses }) => {
  return responses.displayChoices({
    pageTitle: 'Monday Integration Setup',
    htmlOrMarkdownPageContents: 'Choose how you would like to configure your Monday integration:',
    choices: [
      { label: 'Connect with OAuth', value: 'oauth' },
      { label: 'Use a Personal Access Token', value: 'manual' },
    ],
    nextStepId: 'route-choice',
  })
}

const _routeChoiceHandler: WizardHandler = ({ selectedChoice, responses }) => {
  switch (selectedChoice) {
    case 'manual':
      return responses.redirectToStep('manual-configuration')
    case 'oauth':
    default:
      return responses.redirectToStep('oauth-redirect')
  }
}

const _oauthRedirectHandler: WizardHandler = async ({ ctx, responses }) => {
  const redirectUri = OAUTH_REDIRECT_URI

  const url = new URL('https://auth.monday.com/oauth2/authorize')
  url.searchParams.set('client_id', bp.secrets.CLIENT_ID)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'boards:read boards:write')
  url.searchParams.set('state', ctx.webhookId)
  url.searchParams.set('force_install_if_needed', 'true')

  return responses.redirectToExternalUrl(url.toString())
}

const _oauthCallbackHandler: WizardHandler = async ({ ctx, client, query, responses, setIntegrationIdentifier }) => {
  const code = query.get('code')
  const state = query.get('state')

  if (!code) {
    return responses.endWizard({ success: false, errorMessage: 'Missing OAuth code' })
  }

  if (state !== ctx.webhookId) {
    return responses.endWizard({ success: false, errorMessage: 'Invalid OAuth state' })
  }

  const redirectUri = OAUTH_REDIRECT_URI
  const credentials = await exchangeCodeForTokens({ code, redirectUri })
  const validationError = await createOAuthMondayClient(credentials.accessToken).validateAccessToken()

  if (validationError) {
    return responses.endWizard({ success: false, errorMessage: INVALID_CREDENTIALS_MESSAGE })
  }

  await client.setState({
    type: 'integration',
    name: 'oAuthCredentials',
    id: ctx.integrationId,
    payload: {
      accessToken: credentials.accessToken,
      tokenType: credentials.tokenType,
      scope: credentials.scope,
    },
  })

  await client.configureIntegration({ identifier: ctx.webhookId })
  setIntegrationIdentifier(ctx.webhookId)

  return responses.endWizard({ success: true })
}

const _manualConfigurationHandler: WizardHandler = ({ responses }) => {
  return responses.displayForm(_manualConfigurationForm)
}

const _saveManualConfigurationHandler: WizardHandler = async ({
  ctx,
  client,
  formValues,
  responses,
  setIntegrationIdentifier,
}) => {
  if (!formValues) {
    return responses.redirectToStep('manual-configuration')
  }

  const parsed = _manualConfigurationSchema.safeParse(formValues)
  if (!parsed.success) {
    return responses.displayForm({
      ..._manualConfigurationForm,
      errors: parsed.error,
      previousValues: formValues as z.input<typeof _manualConfigurationSchema>,
    })
  }

  const validationError = await createPersonalAccessTokenMondayClient(
    parsed.data.personalAccessToken
  ).validateAccessToken()

  if (validationError) {
    return responses.displayForm({
      ..._manualConfigurationForm,
      errors: _getInvalidCredentialsError(parsed.data),
      previousValues: formValues as z.input<typeof _manualConfigurationSchema>,
    })
  }

  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: {
      personalAccessToken: parsed.data.personalAccessToken,
    },
  })
  await client.setState({
    type: 'integration',
    name: 'oAuthCredentials',
    id: ctx.integrationId,
    payload: {
      accessToken: '',
      tokenType: 'Bearer',
      scope: '',
    },
  })

  await client.configureIntegration({ identifier: ctx.webhookId })
  setIntegrationIdentifier(ctx.webhookId)

  return responses.endWizard({ success: true })
}

const _getInvalidCredentialsError = (values: z.input<typeof _manualConfigurationSchema>) => {
  const schema = _manualConfigurationSchema.refine(() => false, {
    message: INVALID_CREDENTIALS_MESSAGE,
    path: ['personalAccessToken'],
  })

  return schema.safeParse(values).error!
}

const exchangeCodeForTokens = async ({
  code,
  redirectUri,
}: {
  code: string
  redirectUri: string
}): Promise<MondayOAuthCredentials> => {
  const response = await axios.post<MondayOAuthTokenResponse>('https://auth.monday.com/oauth2/token', {
    client_id: bp.secrets.CLIENT_ID,
    client_secret: bp.secrets.CLIENT_SECRET,
    redirect_uri: redirectUri,
    code,
  })

  return {
    accessToken: response.data.access_token,
    tokenType: 'Bearer',
    scope: response.data.scope,
  }
}
