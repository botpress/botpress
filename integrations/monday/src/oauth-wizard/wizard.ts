import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { RuntimeError } from '@botpress/sdk'
import { createOAuthMondayClient } from 'src/misc/auth'
import { exchangeCodeForTokens } from 'src/misc/monday-client'
import * as bp from '.botpress'

type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>

const INVALID_CREDENTIALS_MESSAGE =
  'Invalid Monday credentials. Please reconnect your account or provide a valid token.'
const OAUTH_CONFIGURATION_ERROR_MESSAGE = 'Unable to complete the Monday OAuth setup. Please try again.'
const SCOPES = 'boards:read boards:write'

export const handler = async (props: bp.HandlerProps) => {
  const wizard = new oauthWizard.OAuthWizardBuilder(props)
    .addStep({ id: 'oauth-redirect', handler: _oauthRedirectHandler })
    .addStep({ id: 'oauth-callback', handler: _oauthCallbackHandler })
    .build()

  return await wizard.handleRequest()
}

const _oauthRedirectHandler: WizardHandler = async ({ ctx, responses }) => {
  try {
    const url = new URL('https://auth.monday.com/oauth2/authorize')
    const params = new URLSearchParams({
      client_id: bp.secrets.CLIENT_ID,
      redirect_uri: _getOAuthRedirectUri(),
      response_type: 'code',
      scope: SCOPES,
      state: ctx.webhookId,
      force_install_if_needed: String(true),
    })
    url.search = params.toString()

    return responses.redirectToExternalUrl(url.toString())
  } catch (thrown) {
    return responses.endWizard({
      success: false,
      errorMessage: _formatWizardError(thrown, OAUTH_CONFIGURATION_ERROR_MESSAGE),
    })
  }
}

const _oauthCallbackHandler: WizardHandler = async ({ ctx, client, query, responses, setIntegrationIdentifier }) => {
  try {
    const code = query.get('code')
    const state = query.get('state')

    if (!code) {
      return responses.endWizard({ success: false, errorMessage: 'Missing OAuth code' })
    }

    if (state !== ctx.webhookId) {
      return responses.endWizard({ success: false, errorMessage: 'Invalid OAuth state' })
    }

    const credentials = await _exchangeCodeForTokens({ code, redirectUri: _getOAuthRedirectUri() })
    const mondayClient = createOAuthMondayClient(credentials.accessToken)
    const validationError = await mondayClient.validateAccessToken()

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
  } catch (thrown) {
    return responses.endWizard({
      success: false,
      errorMessage: _formatWizardError(thrown, OAUTH_CONFIGURATION_ERROR_MESSAGE),
    })
  }
}

const _formatWizardError = (thrown: unknown, fallbackMessage: string) => {
  const message = thrown instanceof Error ? thrown.message : String(thrown)
  return message ? `${fallbackMessage} (${message})` : fallbackMessage
}

const _exchangeCodeForTokens = async ({ code, redirectUri }: { code: string; redirectUri: string }) => {
  try {
    return await exchangeCodeForTokens({
      clientId: bp.secrets.CLIENT_ID,
      clientSecret: bp.secrets.CLIENT_SECRET,
      redirectUri,
      code,
    })
  } catch (thrown) {
    const message = thrown instanceof Error ? thrown.message : String(thrown)
    throw new RuntimeError(`Failed to exchange Monday OAuth code for tokens. ${message}`)
  }
}

const _getOAuthRedirectUri = () => oauthWizard.getWizardStepUrl('oauth-callback').toString()
