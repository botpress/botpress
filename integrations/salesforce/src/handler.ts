import { generateRedirection } from '@botpress/common/src/html-dialogs'
import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { Connection, OAuth2 } from 'jsforce'
import { getEnvironmentUrl } from './misc/utils/sf-utils'
import * as bp from '.botpress'

const _startStep: oauthWizard.WizardStepHandler<bp.HandlerProps> = async ({ ctx, responses }) => {
  const oauthCallbackUrl = oauthWizard.getWizardStepUrl('oauth-callback', ctx).toString()
  const loginUrl = getEnvironmentUrl(ctx)
  const url =
    `${loginUrl}/services/oauth2/authorize` +
    '?response_type=code' +
    `&client_id=${bp.secrets.CONSUMER_KEY}` +
    `&redirect_uri=${encodeURIComponent(oauthCallbackUrl)}` +
    `&state=${ctx.webhookId}`
  return responses.redirectToExternalUrl(url)
}

const _oauthCallbackStep: oauthWizard.WizardStepHandler<bp.HandlerProps> = async ({
  ctx,
  client,
  query,
  responses,
}) => {
  const error = query.get('error')
  if (error) {
    const description = query.get('error_description') ?? ''
    return responses.endWizard({ success: false, errorMessage: `OAuth error: ${error} - ${description}` })
  }

  const code = query.get('code')
  if (!code) {
    return responses.endWizard({ success: false, errorMessage: 'Authorization code not present in OAuth callback' })
  }

  const oauthCallbackUrl = oauthWizard.getWizardStepUrl('oauth-callback', ctx).toString()
  const oauth2 = new OAuth2({
    clientId: bp.secrets.CONSUMER_KEY,
    clientSecret: bp.secrets.CONSUMER_SECRET,
    redirectUri: oauthCallbackUrl,
    loginUrl: getEnvironmentUrl(ctx),
  })

  const connection = new Connection({ oauth2 })
  await connection.authorize(code)
  const { accessToken, instanceUrl, refreshToken } = connection

  if (!refreshToken) {
    return responses.endWizard({ success: false, errorMessage: 'No refresh token provided' })
  }

  await client.setState({
    type: 'integration',
    name: 'credentials',
    id: ctx.integrationId,
    payload: {
      isSandbox: ctx.configurationType === 'sfsandbox',
      accessToken,
      instanceUrl,
      refreshToken,
    },
  })

  await client.configureIntegration({ identifier: ctx.webhookId })

  return responses.endWizard({ success: true })
}

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  const { req } = props

  if (!oauthWizard.isOAuthWizardUrl(req.path)) {
    console.debug('Not an OAuth wizard request, handler will not process the request.')
    return
  }

  try {
    return await new oauthWizard.OAuthWizardBuilder(props)
      .addStep({ id: 'start', handler: _startStep })
      .addStep({ id: 'oauth-callback', handler: _oauthCallbackStep })
      .build()
      .handleRequest()
  } catch (thrown: unknown) {
    const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
    return generateRedirection(oauthWizard.getInterstitialUrl(false, errMsg))
  }
}
