import { Response, z } from '@botpress/sdk'
import queryString from 'query-string'
import { trackIntegrationEvent } from 'src/tracking'
import { getSubpath } from 'src/util'
import * as bp from '../../.botpress'
import { getOAuthConfigId } from '../../integration.definition'
import { generateButtonDialog, generateSelectDialog, getInterstitialUrl, redirectTo } from './html-utils'
import { MetaOauthClient } from './whatsapp'

export type WizardHandlerProps = bp.HandlerProps & { wizardPath: string }
type Credentials = Awaited<ReturnType<typeof getCredentialsState>>
type WizardStepHandlerProps = WizardHandlerProps & { credentials: Credentials }
type WizardStep =
  | 'start-confirm'
  | 'setup'
  | 'get-access-token'
  | 'verify-waba'
  | 'verify-number'
  | 'wrap-up'
  | 'finish-wrap-up'

const ACCESS_TOKEN_UNAVAILABLE_ERROR = 'Access token unavailable, please try again.'
const WABA_ID_UNAVAILABLE_ERROR = 'Whatsapp Business Account ID unavailable, please try again.'
const PHONE_NUMBER_ID_UNAVAILABLE_ERROR = 'Phone number ID unavailable, please try again.'
const INVALID_WIZARD_STEP_ERROR = 'Invalid wizard step'

export const handleWizard = async (props: WizardHandlerProps): Promise<Response> => {
  const { wizardPath, client, ctx } = props
  const credentials = await getCredentialsState(client, ctx)
  const stepHandlerProps = { ...props, credentials }

  const wizardSubpath = getSubpath(wizardPath)
  let handlerResponse: Response | undefined = undefined
  if (!wizardSubpath || wizardSubpath.startsWith('/start-confirm')) {
    handlerResponse = await handleWizardStartConfirm(stepHandlerProps)
  } else if (wizardSubpath.startsWith('/setup')) {
    handlerResponse = await handleWizardSetup(stepHandlerProps)
  } else if (wizardSubpath.startsWith('/get-access-token')) {
    handlerResponse = await handleWizardGetAccessToken(stepHandlerProps)
  } else if (wizardSubpath.startsWith('/verify-waba')) {
    handlerResponse = await handleWizardVerifyWaba(stepHandlerProps)
  } else if (wizardSubpath.startsWith('/verify-number')) {
    handlerResponse = await handleWizardVerifyNumber(stepHandlerProps)
  } else if (wizardSubpath.startsWith('/wrap-up')) {
    handlerResponse = await doStepWrapUp(stepHandlerProps)
  } else if (wizardSubpath.startsWith('/finish-wrap-up')) {
    handlerResponse = await doStepFinishWrapUp(stepHandlerProps)
  }

  return (
    handlerResponse || {
      status: 404,
      body: INVALID_WIZARD_STEP_ERROR,
    }
  )
}

const handleWizardStartConfirm = async (props: WizardStepHandlerProps): Promise<Response> => {
  const { ctx } = props
  await trackWizardStep(ctx, 'start-confirm', 'started')
  return generateButtonDialog({
    title: 'Reset Configuration',
    description:
      'This wizard will reset your configuration, so the bot will stop working on WhatsApp until a new configuration is put in place, continue?',
    buttons: [
      { display: 'Yes', type: 'primary', action: 'NAVIGATE', payload: getWizardStepUrl('setup', ctx) },
      { display: 'No', type: 'secondary', action: 'CLOSE_WINDOW' },
    ],
  })
}

const handleWizardSetup = async (props: WizardStepHandlerProps): Promise<Response> => {
  const { client, ctx } = props
  await trackWizardStep(ctx, 'setup', 'setup-started')
  // Clean current state to start a fresh wizard
  const credentials = { accessToken: undefined, wabaId: undefined, phoneNumberId: undefined }
  await patchCredentialsState(client, ctx, credentials)
  return redirectTo(
    'https://www.facebook.com/v19.0/dialog/oauth?' +
      'client_id=' +
      bp.secrets.CLIENT_ID +
      '&redirect_uri=' +
      getOAuthRedirectUri() +
      '&state=' +
      ctx.webhookId +
      '&config_id=' +
      getOAuthConfigId() +
      '&override_default_response_type=true' +
      '&response_type=code'
  )
}

const handleWizardGetAccessToken = async (props: WizardStepHandlerProps): Promise<Response> => {
  const { req, client, ctx, logger, credentials } = props
  await trackWizardStep(ctx, 'get-access-token', 'started')
  const code = z.string().safeParse(queryString.parse(req.query)['code']).data
  if (!code) {
    throw new Error('Error extracting code from url in OAuth handler')
  }
  const oauthClient = new MetaOauthClient(logger)
  const redirectUri = getOAuthRedirectUri() // Needs to be the same as the one used to get the code
  const accessToken = await oauthClient.getAccessToken(code, redirectUri)
  if (!accessToken) {
    throw new Error(ACCESS_TOKEN_UNAVAILABLE_ERROR)
  }
  const newCredentials = { ...credentials, accessToken }
  await patchCredentialsState(client, ctx, newCredentials)
  return await doStepVerifyWaba({ ...props, credentials: newCredentials })
}

const handleWizardVerifyWaba = async (props: WizardStepHandlerProps): Promise<Response> => {
  const { req } = props
  const parsedQueryString = queryString.parse(req.query)
  const wabaId = z.string().safeParse(parsedQueryString['wabaId']).data
  const force = !!parsedQueryString['force-step']
  return await doStepVerifyWaba(props, wabaId, force)
}

const handleWizardVerifyNumber = async (props: WizardStepHandlerProps): Promise<Response> => {
  const { req } = props
  const parsedQueryString = queryString.parse(req.query)
  const phoneNumberId = z.string().safeParse(parsedQueryString['phoneNumberId']).data
  const force = !!parsedQueryString['force-step']
  return await doStepVerifyNumber(props, phoneNumberId, force)
}

const getWizardStepUrl = (step: WizardStep, ctx?: bp.Context) => {
  let url = `${process.env.BP_WEBHOOK_URL}/oauth/wizard/${step}`
  if (ctx) {
    url += `?state=${ctx.webhookId}`
  }
  return url
}

const getOAuthRedirectUri = () => {
  // Identifier (state) specified in the OAuth request instead of URI
  return getWizardStepUrl('get-access-token', undefined)
}

const doStepVerifyWaba = async (
  props: WizardStepHandlerProps,
  inWabaId?: string,
  force?: boolean
): Promise<Response> => {
  const { client, ctx, logger, credentials } = props
  let wabaId = inWabaId || credentials.wabaId
  await trackWizardStep(ctx, 'verify-waba')
  const { accessToken } = credentials
  if (!accessToken) {
    throw new Error(ACCESS_TOKEN_UNAVAILABLE_ERROR)
  }
  const oauthClient = new MetaOauthClient(logger)
  if (!wabaId || force) {
    const businesses = await oauthClient.getWhatsappBusinessesFromToken(accessToken)
    if (businesses.length === 1) {
      wabaId = businesses[0]?.id
    } else {
      return generateSelectDialog({
        title: 'Select Business',
        description: 'Choose a WhatsApp Business Account to use in this bot:',
        settings: { targetUrl: getWizardStepUrl('verify-waba', ctx) },
        select: {
          key: 'wabaId',
          options: businesses.map((business) => ({ id: business.id, display: business.name })),
        },
        additionalData: [{ key: 'state', value: ctx.webhookId }],
      })
    }
  }

  if (!wabaId) {
    throw new Error(WABA_ID_UNAVAILABLE_ERROR)
  }

  const newCredentials = { ...credentials, wabaId }
  await patchCredentialsState(client, ctx, newCredentials)
  return await doStepVerifyNumber({ ...props, credentials: newCredentials })
}

const doStepVerifyNumber = async (
  props: WizardStepHandlerProps,
  inPhoneNumberId?: string,
  force?: boolean
): Promise<Response> => {
  const { client, ctx, logger, credentials } = props
  let phoneNumberId = inPhoneNumberId || credentials.phoneNumberId
  await trackWizardStep(ctx, 'verify-number')
  const { accessToken, wabaId } = credentials
  if (!accessToken) {
    throw new Error(ACCESS_TOKEN_UNAVAILABLE_ERROR)
  }
  if (!wabaId) {
    throw new Error(WABA_ID_UNAVAILABLE_ERROR)
  }

  const oauthClient = new MetaOauthClient(logger)
  if (!phoneNumberId || force) {
    const phoneNumbers = await oauthClient.getWhatsappNumbersFromBusiness(wabaId, accessToken)
    if (phoneNumbers.length === 1) {
      phoneNumberId = phoneNumbers[0]?.id
    } else {
      return generateSelectDialog({
        title: 'Select the default number',
        description: 'Choose a phone number from the current WhatsApp Business Account to use as default:',
        settings: { targetUrl: getWizardStepUrl('verify-number', ctx) },
        select: {
          key: 'phoneNumberId',
          options: phoneNumbers.map((phoneNumber) => ({
            id: phoneNumber.id,
            display: `${phoneNumber.displayPhoneNumber} (${phoneNumber.verifiedName})`,
          })),
        },
        additionalData: [{ key: 'state', value: ctx.webhookId }],
      })
    }
  }

  if (!phoneNumberId) {
    throw new Error(PHONE_NUMBER_ID_UNAVAILABLE_ERROR)
  }

  const newCredentials = { ...credentials, phoneNumberId }
  await patchCredentialsState(client, ctx, newCredentials)
  return await doStepWrapUp({ ...props, credentials: newCredentials })
}

const doStepFinishWrapUp = async (props: WizardStepHandlerProps): Promise<Response> => {
  const { ctx } = props
  await trackWizardStep(ctx, 'finish-wrap-up', 'completed')
  return redirectTo(getInterstitialUrl(true))
}

const doStepWrapUp = async (props: WizardStepHandlerProps): Promise<Response> => {
  const { client, ctx, logger, credentials } = props
  await trackWizardStep(ctx, 'wrap-up', 'completed')
  const { accessToken, wabaId, phoneNumberId } = credentials
  if (!accessToken) {
    throw new Error(ACCESS_TOKEN_UNAVAILABLE_ERROR)
  }
  if (!wabaId) {
    throw new Error(WABA_ID_UNAVAILABLE_ERROR)
  }
  if (!phoneNumberId) {
    throw new Error(PHONE_NUMBER_ID_UNAVAILABLE_ERROR)
  }
  const oauthClient = new MetaOauthClient(logger)
  await client.configureIntegration({
    identifier: wabaId,
  })
  await oauthClient.registerNumber(phoneNumberId, accessToken)
  await oauthClient.subscribeToWebhooks(wabaId, accessToken)

  return generateButtonDialog({
    title: 'Configuration Complete',
    description: `
Your configuration is now complete and the selected WhatsApp number will start answering as this bot, you can add the number to your personal contacts and test it.

**Here are some things to verify if you are unable to talk with your bot on WhatsApp**

- Confirm if you added the correct number (With country and area code)
- Double check if you published this bot
- Wait a few hours (3-4) for Meta to process the Setup
- Verify if your display name was not denied by Meta (you will get an email in the Facebook accounts email address)
        `,
    buttons: [
      { display: 'Okay', type: 'primary', action: 'NAVIGATE', payload: getWizardStepUrl('finish-wrap-up', ctx) },
    ],
  })
}

const trackWizardStep = async (ctx: bp.Context, step: WizardStep, status?: string) => {
  await trackIntegrationEvent(ctx.botId, 'oauthSetupStep', {
    step,
    status,
  })
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
  } catch {
    return {}
  }
}
