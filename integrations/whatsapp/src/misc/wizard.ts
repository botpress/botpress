import { IntegrationContext, Request } from '@botpress/sdk'
import queryString from 'query-string'
import * as bp from '../../.botpress'
import { generateButtonDialog, generateSelectDialog, getInterstitialUrl, redirectTo } from './html-utils'
import { getOAuthConfigId, MetaOauthClient } from './whatsapp'

export const handleWizard = async (req: Request, client: bp.Client, ctx: IntegrationContext, logger: bp.Logger) => {
  const query = queryString.parse(req.query)

  let wizardStep = query['wizard-step'] || (query['code'] && 'get-access-token') || 'get-access-token'

  let { accessToken, wabaId, phoneNumberId } = await getCredentialsState(client, ctx)

  if (wizardStep === 'start-confirm') {
    return generateButtonDialog({
      title: 'Reset Configuration',
      description:
        'This Wizard will reset your integration configuration, so the bot will stop working for this channel, continue?',
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
    await patchCredentialsState(client, ctx, { accessToken: undefined, wabaId: undefined, phoneNumberId: undefined })

    return redirectTo(
      'https://www.facebook.com/v19.0/dialog/oauth?' +
        'client_id=' +
        bp.secrets.CLIENT_ID +
        '&redirect_uri=' +
        process.env.BP_WEBHOOK_URL +
        '/integration/global/meta/whatsapp' +
        '&state=' +
        ctx.webhookId +
        '&config_id=' +
        getOAuthConfigId() +
        '&override_default_response_type=true' +
        '&response_type=code'
    )
  }

  const oauthClient = new MetaOauthClient(logger)

  if (wizardStep === 'get-access-token') {
    const code = query['code'] as string
    if (code) {
      accessToken = await oauthClient.getAccessToken(code)
      await patchCredentialsState(client, ctx, { accessToken })
    }

    wizardStep = 'verify-waba'
  }

  if (!accessToken) {
    throw new Error('Access token not available, please try again.')
  }

  if (wizardStep === 'verify-waba') {
    wabaId = (query['wabaId'] as string) || wabaId
    if (!wabaId || query['force-step']) {
      const businesses = await oauthClient.getWhatsappBusinessesFromToken(accessToken)
      if (businesses.length === 1) {
        wabaId = businesses[0]?.id
      } else {
        return generateSelectDialog({
          title: 'Select Business',
          description: 'Choose a WhatsApp Business Account to use in this bot:',
          settings: { targetUrl: `${process.env.BP_WEBHOOK_URL}/${ctx.webhookId}` },
          select: {
            key: 'wabaId',
            options: businesses.map((business) => ({ id: business.id, display: business.name })),
          },
          additionalData: [{ key: 'wizard-step', value: 'verify-waba' }],
        })
      }
    }

    await patchCredentialsState(client, ctx, { wabaId })

    wizardStep = 'verify-number'
  }

  if (!wabaId) {
    throw new Error("Couldn't get the Whatsapp Business Account")
  }

  if (wizardStep === 'verify-number') {
    phoneNumberId = (query['phoneNumberId'] as string) || phoneNumberId
    if (!phoneNumberId || query['force-step']) {
      const phoneNumbers = await oauthClient.getWhatsappNumbersFromBusiness(wabaId, accessToken)
      if (phoneNumbers.length === 1) {
        phoneNumberId = phoneNumbers[0]?.id
      } else {
        return generateSelectDialog({
          title: 'Select the default number',
          description: 'Choose a number from the current Whatsapp Business Account to use as default:',
          settings: { targetUrl: `${process.env.BP_WEBHOOK_URL}/${ctx.webhookId}` },
          select: {
            key: 'wabaId',
            options: phoneNumbers.map((phoneNumber) => ({ id: phoneNumber.id, display: phoneNumber.verifiedName })),
          },
          additionalData: [{ key: 'wizard-step', value: 'verify-number' }],
        })
      }
    }

    await patchCredentialsState(client, ctx, { phoneNumberId })

    wizardStep = 'wrap-up'
  }

  if (!phoneNumberId) {
    throw new Error("Couldn't get the Default Number")
  }

  if (wizardStep === 'wrap-up') {
    await client.configureIntegration({
      identifier: wabaId,
    })
    void oauthClient.registerNumber(phoneNumberId, accessToken)
    void oauthClient.subscribeToWebhooks(wabaId, accessToken)

    return redirectTo(getInterstitialUrl(true))
  }

  throw new Error('Failed to wrap up')
}

// client.patchState is not working correctly
const patchCredentialsState = async (
  client: bp.Client,
  ctx: IntegrationContext,
  newState: Partial<typeof bp.states.credentials>
) => {
  const currentState = await getCredentialsState(client, ctx)

  await client.setState({
    type: 'integration',
    name: 'credentials',
    id: ctx.integrationId,
    payload: {
      ...currentState,
      ...newState,
    },
  })
}

const getCredentialsState = async (client: bp.Client, ctx: IntegrationContext) => {
  return (
    (
      await client.getState({
        type: 'integration',
        name: 'credentials',
        id: ctx.integrationId,
      })
    )?.state?.payload || {}
  )
}
