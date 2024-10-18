import { Request, RuntimeError } from '@botpress/sdk'
import queryString from 'query-string'
import * as bp from '../../.botpress'
import { getGlobalWebhookUrl } from '../index'
import { MetaClient } from './client'
import { generateButtonDialog, getInterstitialUrl, redirectTo } from './html-utils'

export const handleWizard = async (req: Request, client: bp.Client, ctx: bp.Context, logger: bp.Logger) => {
  const query = queryString.parse(req.query)

  let wizardStep = query['wizard-step'] || (query['code'] && 'get-access-token') || 'get-access-token'

  let instagramId = (query['instagramId'] as string)
  let { accessToken} = await getCredentialsState(client, ctx)

  if (wizardStep === 'start-confirm') {
    return generateButtonDialog({
      title: 'Reset Configuration',
      description:
        'This wizard will reset your configuration, so the bot will stop working on Messenger until a new configuration is put in place, continue?',
      buttons: [
        { display: 'Yes', type: 'primary', action: 'NAVIGATE', payload: `${req.path}?wizard-step=setup` },
        { display: 'No', type: 'secondary', action: 'CLOSE_WINDOW' },
      ],
    })
  }

  if (wizardStep === 'setup') {
    await client.configureIntegration({
      identifier: ctx.webhookId,
    })

    // Clean current state to start a fresh wizard
    await patchCredentialsState(client, ctx, { accessToken: undefined, pageId: undefined })

    return redirectTo(
      'https://www.instagram.com/oauth/authorize?enable_fb_login=1&force_authentication=0' +
        '&client_id=' +
        bp.secrets.CLIENT_ID +
        '&redirect_uri=' +
        getGlobalWebhookUrl() +
        '&state=' +
        ctx.webhookId +
        '&response_type=code&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish'
    )
  }

  const metaClient = new MetaClient(logger,  { accessToken, instagramId })

  if (wizardStep === 'get-access-token') {
    const code = query['code'] as string
    if (code) {
      console.log('Code is: ' + code)
      accessToken = await metaClient.getAccessTokenFromCode(code)
      metaClient.setAuthConfig({ accessToken })
      console.log('Got access token:', { accessToken })
      await patchCredentialsState(client, ctx, { accessToken })
    }

    wizardStep = 'get-instagram-id'
  }

  if (!accessToken) {
    throw new RuntimeError('Access token not available, please try again.')
  }

  if (wizardStep === 'get-instagram-id') {
    const profile = await metaClient.getUserProfile('me', ['user_id'])
    instagramId = profile.user_id
    console.log('Got instagramId:', { instagramId })
    await patchCredentialsState(client, ctx, { instagramId })
    metaClient.setAuthConfig({ instagramId })
    wizardStep = 'wrap-up'
  }

  if (!instagramId) {
    throw new RuntimeError('Instagram Id not available, please try again.')
  }

  if (wizardStep === 'wrap-up') {
    console.log('Will subscribe')
    await metaClient.subscribeToWebhooks(accessToken)
    await client.configureIntegration({
      identifier: instagramId
    })
    console.log('subscribed')
    return redirectTo(getInterstitialUrl(true))
  }

  throw new RuntimeError('Failed to wrap up')
}

// client.patchState is not working correctly
const patchCredentialsState = async (client: bp.Client, ctx: bp.Context, newState: Partial<typeof bp.states.oauth>) => {
  const currentState = await getCredentialsState(client, ctx)

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

const getCredentialsState = async (client: bp.Client, ctx: bp.Context) => {
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
  } catch (e) {
    return {}
  }
}
