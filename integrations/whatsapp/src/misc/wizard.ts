import { Request } from '@botpress/sdk'
import queryString from 'query-string'
import { trackIntegrationEvent } from 'src/tracking'
import * as bp from '../../.botpress'
import { getOAuthConfigId } from '../../integration.definition'
import { getGlobalWebhookUrl } from '../index'
import { generateButtonDialog, generateSelectDialog, getInterstitialUrl, redirectTo } from './html-utils'
import { MetaOauthClient } from './whatsapp'

export const handleWizard = async (req: Request, client: bp.Client, ctx: bp.Context, logger: bp.Logger) => {
  const query = queryString.parse(req.query)

  let wizardStep = query['wizard-step'] || (query['code'] && 'get-access-token') || 'get-access-token'

  let { accessToken, wabaId, phoneNumberId } = await getCredentialsState(client, ctx)

  if (wizardStep === 'start-confirm') {
    // Tracking the reset confirmation step
    await trackIntegrationEvent(ctx.botId, 'oauthSetupStep', {
      step: wizardStep,
      status: 'started',
    })

    return generateButtonDialog({
      title: 'Reset Configuration',
      description:
        'This wizard will reset your configuration, so the bot will stop working on WhatsApp until a new configuration is put in place, continue?',
      buttons: [
        { display: 'Yes', type: 'primary', action: 'NAVIGATE', payload: `${req.path}?wizard-step=setup` },
        { display: 'No', type: 'secondary', action: 'CLOSE_WINDOW' },
      ],
    })
  } else {
    await trackIntegrationEvent(ctx.botId, 'oauthSetupStep', {
      step: wizardStep,
    })
  }

  if (wizardStep === 'setup') {
    // Tracking the setup step
    await trackIntegrationEvent(ctx.botId, 'oauthSetupStep', {
      step: wizardStep,
      status: 'setup-started',
    })

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
        getGlobalWebhookUrl() +
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
    await trackIntegrationEvent(ctx.botId, 'oauthSetupStep', {
      step: wizardStep,
    })
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

    // Tracking WABA selection
    await trackIntegrationEvent(ctx.botId, 'oauthSetupStep', {
      step: wizardStep,
    })

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

    // Tracking number verification
    await trackIntegrationEvent(ctx.botId, 'oauthSetupStep', {
      step: wizardStep,
    })

    if (!phoneNumberId || query['force-step']) {
      const phoneNumbers = await oauthClient.getWhatsappNumbersFromBusiness(wabaId, accessToken)
      if (phoneNumbers.length === 1) {
        phoneNumberId = phoneNumbers[0]?.id
      } else {
        return generateSelectDialog({
          title: 'Select the default number',
          description: 'Choose a phone number from the current WhatsApp Business Account to use as default:',
          settings: { targetUrl: `${process.env.BP_WEBHOOK_URL}/${ctx.webhookId}` },
          select: {
            key: 'phoneNumberId',
            options: phoneNumbers.map((phoneNumber) => ({
              id: phoneNumber.id,
              display: `${phoneNumber.displayPhoneNumber} (${phoneNumber.verifiedName})`,
            })),
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
    // Tracking completion
    await trackIntegrationEvent(ctx.botId, 'oauthSetupStep', {
      step: 'wrap-up',
      status: 'completed',
    })

    await client.configureIntegration({
      identifier: wabaId,
    })
    await oauthClient.registerNumber(phoneNumberId, accessToken)
    await oauthClient.subscribeToWebhooks(wabaId, accessToken)

    return generateButtonDialog({
      title: 'Configuration Complete',
      description: `Your configuration is now complete and the selected WhatsApp number will start answering as this bot, you can add the number to your personal contacts and test it.

          Here are some things to verify if you are unable to talk with your bot on WhatsApp.

          - Confirm if you added the correct number (With country and area code)
          - Double check if you published this bot
          - Wait a few hours (3-4) for Meta to process the Setup
          - Verify if your display name was not denied by Meta (you will get an email in the Facebook accounts email address)
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
const patchCredentialsState = async (
  client: bp.Client,
  ctx: bp.Context,
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

const getCredentialsState = async (client: bp.Client, ctx: bp.Context) => {
  try {
    return (
      (
        await client.getState({
          type: 'integration',
          name: 'credentials',
          id: ctx.integrationId,
        })
      )?.state?.payload || {}
    )
  } catch (e) {
    return {}
  }
}
