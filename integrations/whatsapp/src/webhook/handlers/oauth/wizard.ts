import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { Response, z } from '@botpress/sdk'
import { trackIntegrationEvent } from 'src/misc/tracking'
import * as bp from '../../../../.botpress'
import { MetaOauthClient } from '../../../auth'

export type WizardHandlerProps = bp.HandlerProps & { wizardPath: string }
type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>
type Credentials = Awaited<ReturnType<typeof _getCredentialsState>>
type WizardStep =
  | 'start-confirm'
  | 'setup'
  | 'get-access-token'
  | 'verify-waba'
  | 'verify-number'
  | 'wrap-up'
  | 'finish-wrap-up'

const ACCESS_TOKEN_UNAVAILABLE_ERROR = 'Access token unavailable, please try again.'
const WABA_ID_UNAVAILABLE_ERROR = 'WhatsApp Business Account ID unavailable, please try again.'
const PHONE_NUMBER_ID_UNAVAILABLE_ERROR = 'Phone number ID unavailable, please try again.'

export const handler = async (props: bp.HandlerProps): Promise<Response> => {
  const wizard = new oauthWizard.OAuthWizardBuilder(props)
    .addStep({
      id: 'start-confirm',
      handler: _startConfirmHandler,
    })
    .addStep({
      id: 'setup',
      handler: _setupHandler,
    })
    .addStep({
      id: 'get-access-token',
      handler: _getAccessTokenHandler,
    })
    .addStep({
      id: 'verify-waba',
      handler: _verifyWabaHandler,
    })
    .addStep({
      id: 'verify-number',
      handler: _verifyNumberHandler,
    })
    .addStep({
      id: 'wrap-up',
      handler: _doStepWrapUp,
    })
    .addStep({
      id: 'finish-wrap-up',
      handler: _doStepFinishWrapUp,
    })
    .build()

  const response = await wizard.handleRequest()
  return response
}

const _startConfirmHandler: WizardHandler = async (props) => {
  const { responses, ctx } = props
  await _trackWizardStep(ctx, 'start-confirm', 'started')
  return responses.displayButtons({
    pageTitle: 'Reset Configuration',
    htmlOrMarkdownPageContents:
      'This wizard will reset your configuration, so the bot will stop working on WhatsApp until a new configuration is put in place, continue?',
    buttons: [
      { label: 'Yes', buttonType: 'primary', action: 'navigate', navigateToStep: 'setup' },
      { label: 'No', buttonType: 'secondary', action: 'close' },
    ],
  })
}

const _setupHandler: WizardHandler = async (props) => {
  const { responses, client, ctx } = props
  await _trackWizardStep(ctx, 'setup', 'setup-started')
  // Clean current state to start a fresh wizard
  const credentials: Credentials = { accessToken: undefined, wabaId: undefined, defaultBotPhoneNumberId: undefined }
  await _patchCredentialsState(client, ctx, credentials)
  return responses.redirectToExternalUrl(
    'https://www.facebook.com/v19.0/dialog/oauth?' +
      'client_id=' +
      bp.secrets.CLIENT_ID +
      '&redirect_uri=' +
      _getOAuthRedirectUri() +
      '&state=' +
      ctx.webhookId +
      '&config_id=' +
      bp.secrets.OAUTH_CONFIG_ID +
      '&override_default_response_type=true' +
      '&response_type=code'
  )
}

const _getAccessTokenHandler: WizardHandler = async (props) => {
  const { req, client, ctx, logger } = props
  await _trackWizardStep(ctx, 'get-access-token', 'started')
  const params = new URLSearchParams(req.query)
  const code = z.string().safeParse(params.get('code')).data
  if (!code) {
    throw new Error('Error extracting code from url in OAuth handler')
  }
  const oauthClient = new MetaOauthClient(logger)
  const redirectUri = _getOAuthRedirectUri() // Needs to be the same as the one used to get the code
  const accessToken = await oauthClient.exchangeAuthorizationCodeForAccessToken(code, redirectUri)
  if (!accessToken) {
    throw new Error(ACCESS_TOKEN_UNAVAILABLE_ERROR)
  }
  const credentials = await _getCredentialsState(client, ctx)
  const newCredentials = { ...credentials, accessToken }
  await _patchCredentialsState(client, ctx, newCredentials)
  return await _doStepVerifyWaba(props, newCredentials)
}

const _verifyWabaHandler: WizardHandler = async (props) => {
  const { selectedChoice } = props
  return await _doStepVerifyWaba(props, undefined, selectedChoice)
}

const _verifyNumberHandler: WizardHandler = async (props) => {
  const { selectedChoice } = props
  return await _doStepVerifyNumber(props, undefined, selectedChoice)
}

const _doStepVerifyWaba = async (
  props: Parameters<WizardHandler>[number],
  credentials?: Credentials,
  inWabaId?: string
): Promise<Response> => {
  const { responses, client, ctx, logger } = props
  await _trackWizardStep(ctx, 'verify-waba')
  let tmpCredentials = credentials
  if (!tmpCredentials) {
    tmpCredentials = await _getCredentialsState(client, ctx)
  }
  let wabaId = inWabaId || tmpCredentials.wabaId
  const { accessToken } = tmpCredentials
  if (!accessToken) {
    throw new Error(ACCESS_TOKEN_UNAVAILABLE_ERROR)
  }
  const oauthClient = new MetaOauthClient(logger)
  if (!wabaId) {
    const businesses = await oauthClient.getWhatsappBusinessesFromToken(accessToken)
    if (businesses.length === 1) {
      wabaId = businesses[0]?.id
    } else {
      return responses.displayChoices({
        pageTitle: 'Select Business',
        htmlOrMarkdownPageContents: 'Choose a WhatsApp Business Account to use in this bot:',
        choices: businesses.map((business) => ({ value: business.id, label: business.name })),
        nextStepId: 'verify-waba',
      })
    }
  }

  if (!wabaId) {
    throw new Error(WABA_ID_UNAVAILABLE_ERROR)
  }

  const newCredentials = { ...tmpCredentials, wabaId }
  await _patchCredentialsState(client, ctx, newCredentials)
  return await _doStepVerifyNumber(props, newCredentials)
}

const _doStepVerifyNumber = async (
  props: Parameters<WizardHandler>[number],
  credentials?: Credentials,
  inDefaultBotPhoneNumberId?: string
): Promise<Response> => {
  const { responses, client, ctx, logger } = props
  await _trackWizardStep(ctx, 'verify-number')
  let tmpCredentials = credentials
  if (!tmpCredentials) {
    tmpCredentials = await _getCredentialsState(client, ctx)
  }
  let defaultBotPhoneNumberId = inDefaultBotPhoneNumberId || tmpCredentials.defaultBotPhoneNumberId
  const { accessToken, wabaId } = tmpCredentials
  if (!accessToken) {
    throw new Error(ACCESS_TOKEN_UNAVAILABLE_ERROR)
  }
  if (!wabaId) {
    throw new Error(WABA_ID_UNAVAILABLE_ERROR)
  }

  const oauthClient = new MetaOauthClient(logger)
  if (!defaultBotPhoneNumberId) {
    const phoneNumbers = await oauthClient.getWhatsappNumbersFromBusiness(wabaId, accessToken)
    if (phoneNumbers.length === 1) {
      defaultBotPhoneNumberId = phoneNumbers[0]?.id
    } else {
      return responses.displayChoices({
        pageTitle: 'Select the default number',
        htmlOrMarkdownPageContents:
          'Choose a phone number from the current WhatsApp Business Account to use as default:',
        choices: phoneNumbers.map((phoneNumber) => ({
          value: phoneNumber.id,
          label: `${phoneNumber.displayPhoneNumber} (${phoneNumber.verifiedName})`,
        })),
        nextStepId: 'verify-number',
      })
    }
  }

  if (!defaultBotPhoneNumberId) {
    throw new Error(PHONE_NUMBER_ID_UNAVAILABLE_ERROR)
  }

  const newCredentials = { ...tmpCredentials, defaultBotPhoneNumberId }
  await _patchCredentialsState(client, ctx, newCredentials)
  return await _doStepWrapUp(props)
}

const _doStepWrapUp: WizardHandler = async (props) => {
  const { responses, client, ctx, logger } = props
  await _trackWizardStep(ctx, 'wrap-up', 'completed')
  const credentials = await _getCredentialsState(client, ctx)
  const { accessToken, wabaId, defaultBotPhoneNumberId } = credentials
  if (!accessToken) {
    throw new Error(ACCESS_TOKEN_UNAVAILABLE_ERROR)
  }
  if (!wabaId) {
    throw new Error(WABA_ID_UNAVAILABLE_ERROR)
  }
  if (!defaultBotPhoneNumberId) {
    throw new Error(PHONE_NUMBER_ID_UNAVAILABLE_ERROR)
  }
  const oauthClient = new MetaOauthClient(logger)
  await client.configureIntegration({
    identifier: wabaId,
  })
  await oauthClient.registerNumber(defaultBotPhoneNumberId, accessToken)
  await oauthClient.subscribeToWebhooks(wabaId, accessToken)

  return responses.displayButtons({
    pageTitle: 'Configuration Complete',
    htmlOrMarkdownPageContents: `
Your configuration is now complete and the selected WhatsApp number will start answering as this bot, you can add the number to your personal contacts and test it.

**Here are some things to verify if you are unable to talk with your bot on WhatsApp**

- Confirm if you added the correct number (With country and area code)
- Double check if you published this bot
- Wait a few hours (3-4) for Meta to process the Setup
- Verify if your display name was not denied by Meta (you will get an email in the Facebook accounts email address)`,
    buttons: [{ label: 'Okay', buttonType: 'primary', action: 'navigate', navigateToStep: 'finish-wrap-up' }],
  })
}

const _doStepFinishWrapUp: WizardHandler = async (props) => {
  const { responses, ctx } = props
  await _trackWizardStep(ctx, 'finish-wrap-up', 'completed')
  return responses.redirectToExternalUrl(oauthWizard.getInterstitialUrl(true).toString())
}

const _getOAuthRedirectUri = (ctx?: bp.Context) => oauthWizard.getWizardStepUrl('get-access-token', ctx).toString()

const _trackWizardStep = async (ctx: bp.Context, step: WizardStep, status?: string) => {
  await trackIntegrationEvent(ctx.botId, 'oauthSetupStep', {
    step,
    status,
  })
}

// client.patchState is not working correctly
const _patchCredentialsState = async (
  client: bp.Client,
  ctx: bp.Context,
  newState: Partial<typeof bp.states.credentials>
) => {
  const currentState = await _getCredentialsState(client, ctx)

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

const _getCredentialsState = async (client: bp.Client, ctx: bp.Context) => {
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
