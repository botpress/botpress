import { Request } from '@botpress/sdk'
import queryString from 'query-string'
import * as bp from '../../.botpress'
import { getOAuthConfigId } from '../../integration.definition'
import { getGlobalWebhookUrl } from '../index'
import { MetaClient } from './client'
import { generateButtonDialog, generateSelectDialog, getInterstitialUrl, redirectTo } from './html-utils'

export const handleWizard = async (req: Request, client: bp.Client, ctx: bp.Context, logger: bp.Logger) => {
  const query = queryString.parse(req.query)

  let wizardStep = query['wizard-step'] || (query['code'] && 'get-access-token') || 'get-access-token'

  let instagramId = (query['instagramId'] as string)
  let { accessToken, pageId, pageToken } = await getCredentialsState(client, ctx)

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
      'https://www.facebook.com/v19.0/dialog/oauth?' +
        'client_id=' +
        bp.secrets.CLIENT_ID +
        '&redirect_uri=' +
        getGlobalWebhookUrl() +
        '&state=' +
        ctx.webhookId +
        '&config_id=' +
        getOAuthConfigId() +
        '&override_default_response_type=true' +
        '&response_type=code'
    )
  }

  const metaClient = new MetaClient(logger)

  if (wizardStep === 'get-access-token') {
    const code = query['code'] as string
    if (code) {
      accessToken = await metaClient.getAccessToken(code)
      console.log('Got access token:', accessToken)
      await patchCredentialsState(client, ctx, { accessToken })
    }

    wizardStep = 'verify-instagramId'
  }

  if (!accessToken) {
    throw new Error('Access token not available, please try again.')
  }

  // We don't save the instagramId, bet we need it to get the pageId/token
  if(wizardStep === 'verify-instagramId' || !pageId || !pageToken) {
    if(instagramId) {
      console.log('got instagram', {instagramId})
      const page = await metaClient.getPageIdAndTokenFromIGAccount(accessToken, instagramId)
      pageId = page.id
      pageToken = page.access_token
      await patchCredentialsState(client, ctx, { pageId, pageToken })
      await client.configureIntegration({
        identifier: instagramId,
      })

      console.log('Got page token:', { pageId, pageToken })
      //await metaClient.subscribeToWebhooks(pageToken, pageId)
    } else {
      const targets = await metaClient.getTargetsFromToken(accessToken, 'instagram_manage_messages')
      if (!targets.length) {
        throw new Error('You need to manage at least one Business Instagram Account')
      } else {
        return generateSelectDialog({
          title: 'Select Instagram Business Account',
          description: 'Choose a Instagram Business Account to use in this bot:',
          settings: { targetUrl: `${process.env.BP_WEBHOOK_URL}/${ctx.webhookId}` },
          select: {
            key: 'instagramId',
            options: targets.map((target) => ({ id: target.id, display: target.name })),
          },
          additionalData: [{ key: 'wizard-step', value: 'verify-instagramId' }],
        })
      }
    }

    wizardStep = 'wrap-up'
  }

  if (!pageId || !pageToken) {
    throw new Error("Couldn't get the Facebook Page Id or Token")
  }

  if (wizardStep === 'wrap-up') {
    return redirectTo(getInterstitialUrl(true))
  }

  throw new Error('Failed to wrap up')
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
