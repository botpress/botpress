import { Response, z } from '@botpress/sdk'
import queryString from 'query-string'
import { getSubpath } from 'src/util'
import * as bp from '../../.botpress'
import { getOAuthConfigId } from '../../integration.definition'
import { generateButtonDialog, generateSelectDialog, getInterstitialUrl, redirectTo } from './html-utils'
import { MetaOauthClient } from './whatsapp'

export type WizardHandlerProps = bp.HandlerProps & { wizardPath: string }
type Credentials = Awaited<ReturnType<typeof getCredentialsState>>
type WizardStepHandlerProps = WizardHandlerProps & { credentials: Credentials }
type WizardStep = 'start-confirm' | 'setup' | 'get-access-token' | 'verify-waba' | 'verify-number' | 'wrap-up'

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
  }

  return (
    handlerResponse || {
      status: 404,
      body: INVALID_WIZARD_STEP_ERROR,
    }
  )
}

const handleWizardStartConfirm = async (props: WizardStepHandlerProps): Promise<Response> => {
  return generateButtonDialog({
    title: 'Reset Configuration',
    description:
      'This wizard will reset your configuration, so the bot will stop working on WhatsApp until a new configuration is put in place, continue?',
    buttons: [
      { display: 'Yes', type: 'primary', action: 'NAVIGATE', payload: getWizardStepUrl(props.ctx, 'setup') },
      { display: 'No', type: 'secondary', action: 'CLOSE_WINDOW' },
    ],
  })
}

const handleWizardSetup = async (props: WizardStepHandlerProps): Promise<Response> => {
  const { client, ctx } = props
  await client.configureIntegration({ identifier: ctx.webhookId }) // TODO: Not necessary if we use state param with webhookId (should work only under OAuth path)
  // Clean current state to start a fresh wizard
  const credentials = { accessToken: undefined, wabaId: undefined, phoneNumberId: undefined }
  await patchCredentialsState(client, ctx, credentials) // TODO: Difference between {} and { accessToken: undefined, wabaId: undefined, phoneNumberId: undefined }?
  return redirectTo(
    'https://www.facebook.com/v19.0/dialog/oauth?' +
      'client_id=' +
      bp.secrets.CLIENT_ID +
      '&redirect_uri=' +
      getWizardStepUrl(ctx, 'get-access-token') + // TODO: See WhatsApp app to know if redirect_uri needs to be static (if so add logic to route to the correct handler)
      '&state=' +
      ctx.webhookId +
      '&config_id=' +
      getOAuthConfigId() + // TODO: See WhatsApp app to know what this is
      '&override_default_response_type=true' +
      '&response_type=code'
  )
}

const handleWizardGetAccessToken = async (props: WizardStepHandlerProps): Promise<Response> => {
  const { req, client, ctx, logger, credentials } = props
  const code = z.string().safeParse(queryString.parse(req.query)['code']).data
  if (!code) {
    throw new Error('Error extracting code from url in OAuth handler')
  }
  const oauthClient = new MetaOauthClient(logger)
  const accessToken = await oauthClient.getAccessToken(code)
  if (!accessToken) {
    throw new Error(ACCESS_TOKEN_UNAVAILABLE_ERROR)
  }

  const newCredentials = { ...credentials, accessToken }
  await patchCredentialsState(client, ctx, newCredentials)
  return await doStepVerifyWaba({ ...props, credentials: newCredentials })
}

const handleWizardVerifyWaba = async (props: WizardStepHandlerProps): Promise<Response> => {
  const { req } = props
  const wabaId = z.string().safeParse(queryString.parse(req.query)['wabaId']).data
  const force = z.boolean().safeParse(queryString.parse(req.query)['force-step']).data
  return await doStepVerifyWaba(props, wabaId, force)
}

const handleWizardVerifyNumber = async (props: WizardStepHandlerProps): Promise<Response> => {
  const { req } = props
  const phoneNumberId = z.string().safeParse(queryString.parse(req.query)['phoneNumberId']).data
  const force = z.boolean().safeParse(queryString.parse(req.query)['force-step']).data
  return await doStepVerifyNumber(props, phoneNumberId, force)
}

const getIntegrationInstanceUrl = (ctx: bp.Context) => {
  return `${process.env.BP_WEBHOOK_URL}/${ctx.webhookId}`
}

const getWizardStepUrl = (ctx: bp.Context, step: WizardStep) => {
  return `${getIntegrationInstanceUrl(ctx)}/oauth/wizard/${step}`
}

const doStepVerifyWaba = async (props: WizardStepHandlerProps, wabaId?: string, force?: boolean): Promise<Response> => {
  const { client, ctx, logger, credentials } = props
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
        settings: { targetUrl: getWizardStepUrl(ctx, 'verify-waba') },
        select: {
          key: 'wabaId',
          options: businesses.map((business) => ({ id: business.id, display: business.name })),
        },
        additionalData: [{ key: 'wizard-step', value: 'verify-waba' }], // TODO: Necessary?
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
  phoneNumberId?: string,
  force?: boolean
): Promise<Response> => {
  const { client, ctx, logger, credentials } = props
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
        settings: { targetUrl: getWizardStepUrl(ctx, 'verify-number') },
        select: {
          key: 'phoneNumberId',
          options: phoneNumbers.map((phoneNumber) => ({
            id: phoneNumber.id,
            display: `${phoneNumber.displayPhoneNumber} (${phoneNumber.verifiedName})`,
          })),
        },
        additionalData: [{ key: 'wizard-step', value: 'verify-number' }], // TODO: Necessary?
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

const doStepWrapUp = async (props: WizardStepHandlerProps): Promise<Response> => {
  const { client, logger, credentials } = props
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

  return redirectTo(getInterstitialUrl(true))
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
