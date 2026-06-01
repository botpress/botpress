import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { RuntimeError, type Response } from '@botpress/sdk'
import { createOAuthMondayClient } from 'src/misc/auth'
import { exchangeCodeForTokens } from 'src/misc/monday-client'
import * as bp from '.botpress'

const OAUTH_CONFIGURATION_ERROR_MESSAGE = 'Unable to complete the Monday OAuth setup. Please try again.'
const DISABLE_INTERSTITIAL_HEADER = { 'x-bp-disable-interstitial': 'true' } as const
const SCOPES = 'boards:read boards:write'

type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>

const getMondayInstallUrl = () => {
  const url = new URL('https://auth.monday.com/oauth2/authorize')
  url.search = new URLSearchParams({
    client_id: bp.secrets.CLIENT_ID,
    response_type: 'install',
  }).toString()
  return url.toString()
}

export const handler = async (props: bp.HandlerProps) => {
  const wizard = new oauthWizard.OAuthWizardBuilder(props)
    .addStep({ id: 'start', handler: _startHandler })
    .addStep({ id: 'confirm-install', handler: _confirmInstallHandler })
    .addStep({ id: 'oauth-redirect', handler: _oauthRedirectHandler })
    .addStep({ id: 'oauth-callback', handler: _oauthCallbackHandler })
    .build()

  return await wizard.handleRequest()
}

const _startHandler: WizardHandler = ({ ctx, responses }) => {
  return responses.displayButtons({
    pageTitle: 'Connect Monday.com',
    htmlOrMarkdownPageContents:
      '1. Click **Next step** to open the Monday.com install page in a new tab.\n' +
      '2. Install the Botpress app in your Monday.com workspace.\n' +
      '3. Return to this wizard and confirm the installation to start the OAuth connection.' +
      `
      <script>
        function installMondayAppAndContinue() {
          window.open(${JSON.stringify(getMondayInstallUrl())}, '_blank', 'noopener,noreferrer');
          window.location.href = ${JSON.stringify(getWizardStepUrl('confirm-install', ctx).toString())};
        }
      </script>
      `,
    buttons: [
      {
        action: 'javascript',
        label: 'Next step',
        callFunction: 'installMondayAppAndContinue',
        buttonType: 'primary',
      },
    ],
  })
}

const _confirmInstallHandler: WizardHandler = ({ responses }) => {
  return responses.displayButtons({
    pageTitle: 'Confirm Monday.com installation',
    htmlOrMarkdownPageContents:
      'Have you installed the Botpress app in your Monday.com workspace?\n\n' +
      'Start OAuth only after the Monday app is installed in your workspace.',
    buttons: [
      {
        action: 'navigate',
        label: 'Yes, continue',
        navigateToStep: 'oauth-redirect',
        buttonType: 'primary',
      },
      {
        action: 'navigate',
        label: 'Go back',
        navigateToStep: 'start',
        buttonType: 'secondary',
      },
    ],
  })
}

const _oauthRedirectHandler: WizardHandler = async ({ ctx, responses }) => {
  try {
    const url = new URL('https://auth.monday.com/oauth2/authorize')
    const params = new URLSearchParams({
      client_id: bp.secrets.CLIENT_ID,
      redirect_uri: getOAuthRedirectUri().toString(),
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

    const credentials = await _exchangeCodeForTokens({ code, redirectUri: getOAuthRedirectUri().toString() })
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

const getWizardStepUrl = (stepId: string, ctx?: { webhookId: string }) => oauthWizard.getWizardStepUrl(stepId, ctx)

const getOAuthRedirectUri = () => getWizardStepUrl('oauth-callback')

export const isOAuthWizardUrl = oauthWizard.isOAuthWizardUrl

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
