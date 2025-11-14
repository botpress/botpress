import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import * as bp from '.botpress'
import axios from 'axios'
import * as sdk from '@botpress/sdk'

type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>

export const handler = async (props: bp.HandlerProps) => {
  const wizard = new oauthWizard.OAuthWizardBuilder(props)
    .addStep({
      id: 'start',
      handler: _startHandler,
    })
    .addStep({
      id: 'reset',
      handler: _resetHandler,
    })
    .addStep({
      id: 'oauth-callback',
      handler: _oauthCallbackHandler,
    })
    .addStep({
      id: 'end',
      handler: _endHandler,
    })
    .build()

  const response = await wizard.handleRequest()
  return response
}

const _startHandler: WizardHandler = ({ responses }) => {
  return responses.displayButtons({
    pageTitle: 'Reset Configuration',
    htmlOrMarkdownPageContents: `
    This wizard will reset your configuration, so the bot will stop working on Messenger until a new configuration is put in place, continue?
  `,
    buttons: [
      {
        action: 'navigate',
        label: 'Yes',
        navigateToStep: 'reset',
        buttonType: 'primary',
      },
      {
        action: 'close',
        label: 'No',
        buttonType: 'secondary',
      },
    ],
  })
}

const _resetHandler: WizardHandler = async ({ responses, client, ctx }) => {
  await client.setState({
    type: 'integration',
    name: 'oauth',
    id: ctx.integrationId,
    payload: {},
  })
  return responses.redirectToExternalUrl(await _getOAuthAuthorizationPromptUri(ctx))
}

const _oauthCallbackHandler: WizardHandler = async (props) => {
  const { responses, query, client, ctx } = props
  const authorizationCode = query.get('code')
  if (!authorizationCode) {
    return responses.endWizard({
      success: false,
      errorMessage: 'Error extracting authorization code in OAuth callback',
    })
  }

  const accessToken = await _exchangeAuthorizationCodeForAccessToken(authorizationCode, ctx)

  const currentState = await client
    .getState({ type: 'integration', name: 'oauth', id: ctx.integrationId })
    .then((result) => result.state.payload)

  await client.setState({
    type: 'integration',
    name: 'oauth',
    id: ctx.integrationId,
    payload: {
      ...currentState,
      ...{ accessToken },
    },
  })

  return responses.redirectToStep('end')
}

const _endHandler: WizardHandler = ({ responses }) => {
  return responses.endWizard({
    success: true,
  })
}

const _getOAuthAuthorizationPromptUri = async (ctx?: bp.Context) =>
  'https://botpress3373.zendesk.com/oauth/authorizations/new?' +
  'response_type=code' +
  '&redirect_uri=' +
  _getOAuthRedirectUri(ctx) +
  '&client_id=' +
  bp.secrets.CLIENT_ID +
  '&scope=tickets%3Aread+tickets%3Awrite+users%3Aread+users%3Awrite' +
  '&code_challenge=' +
  (await sha256(bp.secrets.CODE_CHALLENGE)) +
  '&code_challenge_method=S256'

// taken from zendesk documentation https://developer.zendesk.com/documentation/api-basics/authentication/oauth-pkce/#javascript
const sha256 = async (base64String: string) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(base64String)
  const hash = await window.crypto.subtle.digest('SHA-256', data)
  let binary = ''
  const bytes = new Uint8Array(hash)
  for (const byte of bytes) {
    if (byte === undefined) {
      throw new sdk.RuntimeError('The hash creation failed')
    }
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const _getOAuthRedirectUri = (ctx?: bp.Context) => oauthWizard.getWizardStepUrl('oauth-callback', ctx).toString()
const _exchangeAuthorizationCodeForAccessToken = async (authorizationCode: string, ctx?: bp.Context) => {
  const url = 'https://' + bp.secrets.SUBDOMAIN + '.zendesk.com/oauth/tokens'
  const redirectUri = _getOAuthRedirectUri(ctx)
  const res = await axios.post(
    url,
    {
      grant_type: 'authorization_code',
      code: authorizationCode,
      client_id: bp.secrets.CLIENT_ID,
      client_secret: bp.secrets.CLIENT_SECRET,
      redirectUri,
      code_verifier: bp.secrets.CODE_CHALLENGE,
      scope: 'read',
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
  const data = sdk.z
    .object({
      access_token: sdk.z.string(),
    })
    .parse(res.data)

  return data.access_token
}
