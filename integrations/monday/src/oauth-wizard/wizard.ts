import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import axios from 'axios'
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

export const handler = async (props: bp.HandlerProps) => {
  const wizard = new oauthWizard.OAuthWizardBuilder(props)
    .addStep({ id: 'start', handler: _startHandler })
    .addStep({ id: 'oauth-redirect', handler: _oauthRedirectHandler })
    .addStep({ id: 'oauth-callback', handler: _oauthCallbackHandler })
    .build()

  return await wizard.handleRequest()
}

const _startHandler: WizardHandler = ({ responses }) => {
  return responses.displayButtons({
    pageTitle: 'Connect Account',
    htmlOrMarkdownPageContents: 'Connect your account to continue.',
    buttons: [
      {
        action: 'navigate',
        label: 'Connect',
        navigateToStep: 'oauth-redirect',
        buttonType: 'primary',
      },
    ],
  })
}

const _oauthRedirectHandler: WizardHandler = async ({ ctx, responses }) => {
  const redirectUri = OAUTH_REDIRECT_URI

  const url = new URL('https://auth.monday.com/oauth2/authorize')
  url.searchParams.set('client_id', bp.secrets.CLIENT_ID)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'boards:read boards:write')
  url.searchParams.set('state', ctx.webhookId)

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

  setIntegrationIdentifier(ctx.webhookId)

  return responses.endWizard({ success: true })
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
