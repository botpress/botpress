import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import axios from 'axios'
import { getZohoAuthUrl } from '../client'
import * as bp from '.botpress'

type DataCenter = 'us' | 'eu' | 'in' | 'au' | 'cn' | 'jp' | 'ca'
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

const DATA_CENTER_LABELS: Record<DataCenter, string> = {
  us: 'US - accounts.zoho.com',
  eu: 'EU - accounts.zoho.eu',
  in: 'IN - accounts.zoho.in',
  au: 'AU - accounts.zoho.com.au',
  cn: 'CN - accounts.zoho.com.cn',
  jp: 'JP - accounts.zoho.jp',
  ca: 'CA - accounts.zohocloud.ca',
}

const DATA_CENTER_CHOICES: { label: string; value: DataCenter }[] = Object.entries(DATA_CENTER_LABELS).map(
  ([value, label]) => ({ label, value: value as DataCenter })
)

const _isDataCenter = (value: string | undefined): value is DataCenter =>
  DATA_CENTER_CHOICES.some((choice) => choice.value === value)

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
  if (!_isDataCenter(selectedChoice)) {
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

  const { state } = await client.getState({
    id: ctx.integrationId,
    type: 'integration',
    name: 'oauthWizard',
  })
  const dataCenter = state.payload.dataCenter
  if (!_isDataCenter(dataCenter)) {
    return responses.endWizard({ success: false, errorMessage: 'Zoho data center not found. Please reconnect.' })
  }

  const requestData = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: bp.secrets.CLIENT_ID,
    client_secret: bp.secrets.CLIENT_SECRET,
    redirect_uri: _getOAuthRedirectUri(),
    code,
  })

  const response = await axios.post(`${getZohoAuthUrl(dataCenter)}/oauth/v2/token`, requestData.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })

  if (!response.data.refresh_token) {
    logger.forBot().warn('Zoho OAuth token response did not include a refresh token.')
    return responses.endWizard({
      success: false,
      errorMessage: 'Zoho did not return a refresh token. Please reconnect and grant consent.',
    })
  }

  await client.setState({
    id: ctx.integrationId,
    type: 'integration',
    name: 'credentials',
    payload: {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      dataCenter,
      apiDomain: response.data.api_domain,
      expiresAt: response.data.expires_in ? Date.now() + response.data.expires_in * 1000 : undefined,
    },
  })

  await client.configureIntegration({ identifier: ctx.webhookId })

  return responses.endWizard({ success: true })
}
