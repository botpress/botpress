import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import * as sdk from '@botpress/sdk'
import axios from 'axios'
import { webcrypto } from 'crypto'
import * as bp from '.botpress'

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
  await _patchCredentialsState(client, ctx, { accessToken: undefined })
  return responses.redirectToExternalUrl(
    'https://' +
      bp.secrets.SUBDOMAIN +
      '.zendesk.com/oauth/authorizations/new?' +
      'response_type=code' +
      '&redirect_uri=' +
      _getOAuthRedirectUri() +
      '&state=' +
      ctx.webhookId +
      '&client_id=' +
      bp.secrets.CLIENT_ID +
      '&scope=read+write' +
      '&code_challenge=' +
      (await sha256(bp.secrets.CODE_CHALLENGE)) +
      '&code_challenge_method=S256'
  )
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

  const accessToken = await _exchangeAuthorizationCodeForAccessToken(authorizationCode)

  const credentials = await _getCredentialsState(client, ctx)
  const newCredentials = { ...credentials, accessToken }
  await _patchCredentialsState(client, ctx, newCredentials)

  return responses.redirectToStep('end')
}

const _endHandler: WizardHandler = ({ responses }) => {
  return responses.endWizard({
    success: true,
  })
}

const sha256 = async (str: string) => {
  const data = new TextEncoder().encode(str)
  const hash = await webcrypto.subtle.digest('SHA-256', data)
  return Buffer.from(hash).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const _getOAuthRedirectUri = (ctx?: bp.Context) => oauthWizard.getWizardStepUrl('oauth-callback', ctx).toString()

const _exchangeAuthorizationCodeForAccessToken = async (authorizationCode: string) => {
  const url = 'https://' + bp.secrets.SUBDOMAIN + '.zendesk.com/oauth/tokens'
  const res = await axios.post(
    url,
    {
      grant_type: 'authorization_code',
      code: authorizationCode,
      client_id: bp.secrets.CLIENT_ID,
      redirect_uri: _getOAuthRedirectUri(),
      scope: 'read write',
      code_verifier: bp.secrets.CODE_CHALLENGE,
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

// client.patchState is not working correctly
const _patchCredentialsState = async (
  client: bp.Client,
  ctx: bp.Context,
  newState: Partial<typeof bp.states.oauth>
) => {
  const currentState = await _getCredentialsState(client, ctx)

  await client.setState({
    type: 'integration',
    name: 'oauth',
    id: ctx.integrationId,
    payload: {
      ...currentState,
      ...newState,
    },
  })
}

const _getCredentialsState = async (client: bp.Client, ctx: bp.Context) => {
  try {
    return (
      (
        await client.getState({
          type: 'integration',
          name: 'oauth',
          id: ctx.integrationId,
        })
      )?.state?.payload || {}
    )
  } catch {
    return {}
  }
}
