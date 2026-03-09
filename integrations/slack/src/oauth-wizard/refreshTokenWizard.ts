import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { Response, RuntimeError } from '@botpress/sdk'
import { states } from 'definitions'
import { handleOAuthCallback } from '../webhook-events/handlers/oauth-callback'
import * as bp from '.botpress'

type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>
type ManualConfigState = bp.states.oAuthCredentialsV2.OAuthCredentialsV2['payload']

export const handler = async (props: bp.HandlerProps): Promise<Response> => {
  const wizard = new oauthWizard.OAuthWizardBuilder(props)
    .addStep({ id: 'start', handler: _startHandler })
    .addStep({ id: 'get-client-id', handler: _getClientIdHandler })
    .addStep({ id: 'save-client-id', handler: _saveClientIdHandler })
    .addStep({ id: 'get-client-secret', handler: _getClientSecretHandler })
    .addStep({ id: 'save-client-secret', handler: _saveClientSecretHandler })
    .addStep({ id: 'get-signing-secret', handler: _getSigningSecretHandler })
    .addStep({ id: 'save-signing-secret', handler: _saveSigningSecretHandler })
    .addStep({ id: 'authorize', handler: _authorizeHandler })
    .addStep({ id: 'oauth-callback', handler: _oauthCallbackHandler })
    .addStep({ id: 'end', handler: _endHandler })
    .build()

  return await wizard.handleRequest()
}

const _patchManualConfigState = async (
  client: bp.Client,
  ctx: bp.Context,
  newState: Partial<ManualConfigState>,
  logger?: bp.Logger
) => {
  const state = await _manualConfigState(client, ctx)
  logger?.forBot().debug(state)
  logger?.forBot().debug('new', newState)
  const { data, success, error } = states.oAuthCredentialsV2.schema.safeParse({
    ...state,
    ...newState,
  })
  if (!success) {
    throw new RuntimeError(`Error while parsing manualConfig state: ${JSON.stringify(error)}`)
  }
  await client.setState({
    type: 'integration',
    id: ctx.integrationId,
    name: 'oAuthCredentialsV2',
    payload: data,
  })
}

const _manualConfigState = async (client: bp.Client, ctx: bp.Context): Promise<Partial<ManualConfigState>> => {
  try {
    const { state } = await client.getState({
      type: 'integration',
      name: 'oAuthCredentialsV2',
      id: ctx.integrationId,
    })
    return state.payload
  } catch {
    return {}
  }
}

const _startHandler: WizardHandler = async ({ client, ctx, responses }) => {
  const { clientId, clientSecret, signingSecret, authorizeUrl } = await _manualConfigState(client, ctx)

  if (clientId && clientSecret && signingSecret && authorizeUrl) {
    return responses.redirectToExternalUrl(authorizeUrl)
  }

  return responses.displayButtons({
    pageTitle: 'Slack Manual Configuration',
    htmlOrMarkdownPageContents:
      'This wizard will configure your existing Slack app for use with Botpress.<br><br>' +
      "You will need your Slack app's <b>Client ID</b>, <b>Client Secret</b>, and <b>Signing Secret</b>.<br>" +
      'You can find these in your <a href="https://api.slack.com/apps" target="_blank">Slack App settings</a>.',
    buttons: [
      { action: 'navigate', label: 'Continue', navigateToStep: 'get-client-id', buttonType: 'primary' },
      { action: 'close', label: 'Cancel', buttonType: 'secondary' },
    ],
  })
}

const _getClientIdHandler: WizardHandler = ({ responses }) => {
  return responses.displayInput({
    pageTitle: 'Client ID',
    htmlOrMarkdownPageContents:
      'Enter your Slack app\'s <b>Client ID</b>.<br>Find it under <i>Basic Information → App Credentials</i> in your <a href="https://api.slack.com/apps" target="_blank">Slack App settings</a>.',
    input: { label: 'Client ID', type: 'text' },
    nextStepId: 'save-client-id',
  })
}

const _saveClientIdHandler: WizardHandler = async ({ client, ctx, responses, inputValue, logger }) => {
  if (!inputValue?.trim()) {
    return responses.redirectToStep('get-client-id')
  }
  await _patchManualConfigState(client, ctx, { clientId: inputValue.trim() }, logger)
  return responses.redirectToStep('get-client-secret')
}

const _getClientSecretHandler: WizardHandler = ({ responses }) => {
  return responses.displayInput({
    pageTitle: 'Client Secret',
    htmlOrMarkdownPageContents:
      'Enter your Slack app\'s <b>Client Secret</b>.<br>Find it under <i>Basic Information → App Credentials</i> in your <a href="https://api.slack.com/apps" target="_blank">Slack App settings</a>.',
    input: { label: 'Client Secret', type: 'password' },
    nextStepId: 'save-client-secret',
  })
}

const _saveClientSecretHandler: WizardHandler = async ({ client, ctx, responses, inputValue }) => {
  if (!inputValue?.trim()) {
    return responses.redirectToStep('get-client-secret')
  }
  await _patchManualConfigState(client, ctx, { clientSecret: inputValue.trim() })
  return responses.redirectToStep('get-signing-secret')
}

const _getSigningSecretHandler: WizardHandler = ({ responses }) => {
  return responses.displayInput({
    pageTitle: 'Signing Secret',
    htmlOrMarkdownPageContents:
      'Enter your Slack app\'s <b>Signing Secret</b>.<br>Find it under <i>Basic Information → App Credentials</i> in your <a href="https://api.slack.com/apps" target="_blank">Slack App settings</a>.',
    input: { label: 'Signing Secret', type: 'password' },
    nextStepId: 'save-signing-secret',
  })
}

const _saveSigningSecretHandler: WizardHandler = async ({ client, ctx, responses, inputValue }) => {
  if (!inputValue?.trim()) {
    return responses.redirectToStep('get-signing-secret')
  }
  await _patchManualConfigState(client, ctx, { signingSecret: inputValue.trim() })
  return responses.redirectToStep('authorize')
}

const _authorizeHandler: WizardHandler = async ({ client, ctx, responses }) => {
  const { clientId } = await _manualConfigState(client, ctx)

  if (!clientId) {
    return responses.redirectToStep('get-client-id')
  }

  const oauthCallbackUrl = oauthWizard.getWizardStepUrl('oauth-callback').toString()
  const authorizeUrl = new URL('https://slack.com/oauth/v2/authorize')
  authorizeUrl.searchParams.set('client_id', clientId)
  authorizeUrl.searchParams.set('scope', 'app_configurations:write')
  authorizeUrl.searchParams.set('redirect_uri', oauthCallbackUrl)
  authorizeUrl.searchParams.set('state', ctx.webhookId)

  await _patchManualConfigState(client, ctx, { authorizeUrl: authorizeUrl.toString() })

  return responses.redirectToExternalUrl(authorizeUrl.toString())
}

const _oauthCallbackHandler: WizardHandler = async ({ req, client, ctx, logger, responses }) => {
  await handleOAuthCallback({ req, client, ctx, logger })
  return responses.redirectToStep('end')
}

const _endHandler: WizardHandler = ({ responses }) => {
  return responses.endWizard({ success: true })
}
