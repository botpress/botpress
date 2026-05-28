import { OAUTH_IDENTIFIER_HEADER, RuntimeError, type Response } from '@botpress/sdk'
import { createOAuthMondayClient } from 'src/misc/auth'
import { exchangeCodeForTokens } from 'src/misc/monday-client'
import * as bp from '.botpress'

const OAUTH_CONFIGURATION_ERROR_MESSAGE = 'Unable to complete the Monday OAuth setup. Please try again.'
const BASE_WIZARD_PATH = '/oauth/wizard/'
const DISABLE_INTERSTITIAL_HEADER = { 'x-bp-disable-interstitial': 'true' } as const
const SCOPES = 'boards:read boards:write'

export const handler = async (props: bp.HandlerProps) => {
  if (!isOAuthWizardUrl(props.req.path)) {
    throw new RuntimeError('Invalid OAuth wizard URL')
  }

  const stepId = props.req.path.slice(BASE_WIZARD_PATH.length)
  const query = new URLSearchParams(props.req.query)

  if (stepId === 'oauth-redirect') {
    return await _oauthRedirectHandler(props)
  }

  if (stepId === 'oauth-callback') {
    return await _oauthCallbackHandler(props, query)
  }

  throw new RuntimeError(`Unknown OAuth wizard step: ${stepId}`)
}

const _oauthRedirectHandler = async ({ ctx }: bp.HandlerProps) => {
  try {
    const url = new URL('https://auth.monday.com/oauth2/authorize')
    const params = new URLSearchParams({
      client_id: bp.secrets.CLIENT_ID,
      redirect_uri: getOAuthRedirectUri(),
      response_type: 'code',
      scope: SCOPES,
      state: ctx.webhookId,
      force_install_if_needed: String(true),
    })
    url.search = params.toString()

    return redirectToUrl(url)
  } catch (thrown) {
    return redirectToInterstitial(false, _formatWizardError(thrown, OAUTH_CONFIGURATION_ERROR_MESSAGE))
  }
}

const _oauthCallbackHandler = async ({ ctx, client }: bp.HandlerProps, query: URLSearchParams) => {
  try {
    const code = query.get('code')
    const state = query.get('state')

    if (!code) {
      return redirectToInterstitial(false, 'Missing OAuth code')
    }

    if (state !== ctx.webhookId) {
      return redirectToInterstitial(false, 'Invalid OAuth state')
    }

    const credentials = await _exchangeCodeForTokens({ code, redirectUri: getOAuthRedirectUri() })
    const mondayClient = createOAuthMondayClient(credentials.accessToken)
    await mondayClient.validateAccessToken()

    await client.setState({
      type: 'integration',
      name: 'oAuthCredentials',
      id: ctx.integrationId,
      payload: {
        accessToken: credentials.accessToken,
      },
    })

    await client.configureIntegration({ identifier: ctx.webhookId })

    const response = redirectToInterstitial(true)
    return {
      ...response,
      headers: {
        ...response.headers,
        [OAUTH_IDENTIFIER_HEADER]: ctx.webhookId,
      },
    }
  } catch (thrown) {
    return redirectToInterstitial(false, _formatWizardError(thrown, OAUTH_CONFIGURATION_ERROR_MESSAGE))
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

const getWizardStepUrl = (stepId: string) => new URL(`${BASE_WIZARD_PATH}${stepId}`, process.env.BP_WEBHOOK_URL)

const getOAuthRedirectUri = () => getWizardStepUrl('oauth-callback').toString()

export const isOAuthWizardUrl = (path: string) => path.startsWith(BASE_WIZARD_PATH)

const redirectToUrl = (url: URL): Response => ({
  status: 303,
  headers: {
    ...DISABLE_INTERSTITIAL_HEADER,
    location: url.toString(),
  },
})

export const redirectToInterstitial = (success: boolean, message?: string): Response => {
  const url = new URL(
    `${process.env.BP_WEBHOOK_URL?.replace('webhook', 'app')}/oauth/interstitial?success=${success}${
      message ? `&errorMessage=${message}` : ''
    }`
  )

  return redirectToUrl(url)
}
