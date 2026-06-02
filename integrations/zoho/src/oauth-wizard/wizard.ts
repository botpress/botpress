import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import axios from 'axios'
import { DATA_CENTER_CHOICES, getZohoAuthUrl, isDataCenter } from '../misc/data-centers'
import { zohoTokenResponseSchema } from '../misc/oauth-schemas'
import * as bp from '.botpress'

type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>

const ZOHO_SCOPES = [
  'ZohoCRM.modules.ALL',
  'ZohoCRM.org.ALL',
  'ZohoCRM.users.ALL',
  'ZohoCRM.settings.ALL',
  'ZohoCRM.send_mail.all.CREATE',
  'ZohoCRM.files.CREATE',
  'ZohoCRM.files.READ',
]

const _getOAuthRedirectUri = () => oauthWizard.getWizardStepUrl('oauth-callback').toString()

export const handler = async (props: bp.HandlerProps) => {
  return await new oauthWizard.OAuthWizardBuilder(props)
    .addStep({ id: 'start', handler: _startStep })
    .addStep({ id: 'oauth-redirect', handler: _oauthRedirectStep })
    .addStep({ id: 'oauth-callback', handler: _oauthCallbackStep })
    .build()
    .handleRequest()
}

const _startStep: WizardHandler = ({ responses }) => {
  return responses.displayChoices({
    pageTitle: 'Connect Zoho CRM',
    htmlOrMarkdownPageContents: 'Select the Zoho data center for the account you want to connect.',
    choices: DATA_CENTER_CHOICES,
    nextStepId: 'oauth-redirect',
    defaultValues: ['us'],
  })
}

const _oauthRedirectStep: WizardHandler = async ({ selectedChoice, responses, ctx, client }) => {
  if (!isDataCenter(selectedChoice)) {
    return responses.endWizard({
      success: false,
      errorMessage: 'Please select a valid Zoho data center.',
    })
  }

  await client.setState({
    id: ctx.integrationId,
    type: 'integration',
    name: 'oauthWizard',
    payload: {
      dataCenter: selectedChoice,
    },
  })

  const params = new URLSearchParams({
    scope: ZOHO_SCOPES.join(','),
    client_id: bp.secrets.CLIENT_ID,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    redirect_uri: _getOAuthRedirectUri(),
    state: ctx.webhookId,
  })

  return responses.redirectToExternalUrl(`${getZohoAuthUrl(selectedChoice)}/oauth/v2/auth?${params.toString()}`)
}

const _oauthCallbackStep: WizardHandler = async ({ query, responses, client, ctx, logger }) => {
  const error = query.get('error')
  if (error) {
    const description = query.get('error_description') ?? ''
    return responses.endWizard({ success: false, errorMessage: `OAuth error: ${error} - ${description}` })
  }

  const code = query.get('code')
  if (!code) {
    return responses.endWizard({ success: false, errorMessage: 'Authorization code not present in OAuth callback.' })
  }

  const returnedState = query.get('state')
  if (returnedState !== ctx.webhookId) {
    logger.forBot().warn('Invalid Zoho OAuth state parameter received.')
    return responses.endWizard({ success: false, errorMessage: 'Invalid OAuth state parameter.' })
  }

  const { state } = await client.getState({
    id: ctx.integrationId,
    type: 'integration',
    name: 'oauthWizard',
  })
  const dataCenter = state.payload.dataCenter
  if (!isDataCenter(dataCenter)) {
    return responses.endWizard({ success: false, errorMessage: 'Zoho data center not found. Please reconnect.' })
  }

  const requestData = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: bp.secrets.CLIENT_ID,
    client_secret: bp.secrets.CLIENT_SECRET,
    redirect_uri: _getOAuthRedirectUri(),
    code,
  })

  let response
  try {
    response = await axios.post(`${getZohoAuthUrl(dataCenter)}/oauth/v2/token`, requestData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
  } catch (error: unknown) {
    logger.forBot().error('Zoho OAuth token exchange failed.', axios.isAxiosError(error) ? error.response?.data : error)
    return responses.endWizard({
      success: false,
      errorMessage: 'Zoho could not exchange the authorization code. Please reconnect and try again.',
    })
  }

  const tokenResponse = zohoTokenResponseSchema.safeParse(response.data)
  if (!tokenResponse.success) {
    logger.forBot().warn('Zoho OAuth token response failed validation.', tokenResponse.error.message)
    return responses.endWizard({
      success: false,
      errorMessage: 'Zoho returned an invalid OAuth token response. Please reconnect and grant consent.',
    })
  }

  await client.setState({
    id: ctx.integrationId,
    type: 'integration',
    name: 'credentials',
    payload: {
      accessToken: tokenResponse.data.access_token,
      refreshToken: tokenResponse.data.refresh_token,
      dataCenter,
      apiDomain: tokenResponse.data.api_domain,
      expiresAt: tokenResponse.data.expires_in ? Date.now() + tokenResponse.data.expires_in * 1000 : undefined,
    },
  })

  await client.configureIntegration({ identifier: ctx.webhookId })

  return responses.endWizard({ success: true })
}
