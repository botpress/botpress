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

  let { accessToken, pageId } = await getCredentialsState(client, ctx)

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
      await patchCredentialsState(client, ctx, { accessToken })
    }

    wizardStep = 'verify-page'
  }

  if (!accessToken) {
    throw new Error('Access token not available, please try again.')
  }

  if (wizardStep === 'verify-page') {
    pageId = (query['pageId'] as string) || pageId
    if (!pageId || query['force-step']) {
      const pages = await metaClient.getFacebookPagesFromToken(accessToken)
      if (!pages.length) {
        throw new Error('You need to manage at least one Facebook Page')
      } else {
        return generateSelectDialog({
          title: 'Select Page',
          description: 'Choose a Facebook Page to use in this bot:',
          settings: { targetUrl: `${process.env.BP_WEBHOOK_URL}/${ctx.webhookId}` },
          select: {
            key: 'pageId',
            options: pages.map((page) => ({ id: page.id, display: page.name })),
          },
          additionalData: [{ key: 'wizard-step', value: 'verify-page' }],
        })
      }
    }

    await patchCredentialsState(client, ctx, { pageId })

    wizardStep = 'wrap-up'
  }

  if (!pageId) {
    throw new Error("Couldn't get the Facebook Page Id")
  }

  if (wizardStep === 'wrap-up') {
    const pageToken = await metaClient.getPageToken(accessToken, pageId)
    await patchCredentialsState(client, ctx, { pageToken })
    await metaClient.subscribeToWebhooks(pageToken, pageId)

    await client.configureIntegration({
      identifier: pageId,
    })

    return generateButtonDialog({
      title: 'Configuration Complete',
      description: `Your configuration is now complete and the selected Facebook page will start answering as this bot, you can open it on Messenger and test it.

          Here are some things to verify if you are unable to talk with your bot on Messenger.

          - Confirm if are talking with the page that was selected for this bot
          - Double check if you published this bot
        `,
      buttons: [
        { display: 'Okay', type: 'primary', action: 'NAVIGATE', payload: `${req.path}?wizard-step=wrap-up-finish` },
      ],
    })
  }

  if (wizardStep === 'wrap-up-finish') {
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
