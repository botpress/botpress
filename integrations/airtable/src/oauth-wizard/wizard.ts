import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { Response, z } from '@botpress/sdk'
import axios from 'axios'
import * as crypto from 'crypto'
import { AirtableOAuthClient } from '../airtable-api/airtable-oauth-client'
import * as bp from '.botpress'

type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>

const REQUIRED_AIRTABLE_SCOPES = ['data.records:read', 'data.records:write', 'schema.bases:read', 'schema.bases:write']

const _getRedirectUri = () => `${process.env.BP_WEBHOOK_URL}/oauth/wizard/oauth-callback`

const _generateCodeVerifier = (): string => crypto.randomBytes(64).toString('base64url')
const _generateCodeChallenge = (verifier: string): string =>
  crypto.createHash('sha256').update(verifier).digest('base64url')

const _buildAirtableAuthorizeUrl = ({
  codeChallenge,
  webhookId,
}: {
  codeChallenge: string
  webhookId: string
}): string => {
  const params = new URLSearchParams({
    client_id: bp.secrets.CLIENT_ID,
    redirect_uri: _getRedirectUri(),
    response_type: 'code',
    scope: REQUIRED_AIRTABLE_SCOPES.join(' '),
    state: webhookId,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })
  return `https://airtable.com/oauth2/v1/authorize?${params.toString()}`
}

const _manualCredentialsSchema = z.object({
  personalAccessToken: z
    .string()
    .secret()
    .title('Personal Access Token')
    .describe('An Airtable Personal Access Token with access to the base you want to use'),
  baseId: z.string().title('Base ID').describe('The ID of the Airtable base (starts with "app")'),
  endpointUrl: z
    .string()
    .optional()
    .title('Endpoint URL')
    .describe('Optional override for the Airtable API endpoint (default: https://api.airtable.com/v0/)'),
})

const _manualCredentialsForm = {
  pageTitle: 'Airtable Personal Access Token',
  htmlOrMarkdownPageContents:
    'Enter your Airtable Personal Access Token and the ID of the base you want to use.<br>' +
    'You can create a token in the <a href="https://airtable.com/create/tokens" target="_blank">Airtable developer hub</a>.',
  schema: _manualCredentialsSchema,
  nextStepId: 'save-manual-credentials',
}

export const handler = async (props: bp.HandlerProps): Promise<Response> => {
  const wizard = new oauthWizard.OAuthWizardBuilder(props)
    .addStep({ id: 'start', handler: _startHandler })
    .addStep({ id: 'route-choice', handler: _routeChoiceHandler })
    .addStep({ id: 'oauth-redirect', handler: _oauthRedirectHandler })
    .addStep({ id: 'oauth-callback', handler: _oauthCallbackHandler })
    .addStep({ id: 'pick-base', handler: _pickBaseHandler })
    .addStep({ id: 'save-base', handler: _saveBaseHandler })
    .addStep({ id: 'get-manual-credentials', handler: _getManualCredentialsHandler })
    .addStep({ id: 'save-manual-credentials', handler: _saveManualCredentialsHandler })
    .build()

  return await wizard.handleRequest()
}

const _startHandler: WizardHandler = ({ responses }) => {
  return responses.displayChoices({
    pageTitle: 'Airtable Integration Setup',
    htmlOrMarkdownPageContents: 'Choose how you would like to configure your Airtable integration:',
    choices: [
      { label: 'Connect with OAuth', value: 'oauth' },
      { label: 'Use a Personal Access Token', value: 'manual' },
    ],
    nextStepId: 'route-choice',
  })
}

const _routeChoiceHandler: WizardHandler = ({ selectedChoice, responses }) => {
  switch (selectedChoice) {
    case 'manual':
      return responses.redirectToStep('get-manual-credentials')
    case 'oauth':
    default:
      return responses.redirectToStep('oauth-redirect')
  }
}

const _oauthRedirectHandler: WizardHandler = async ({ ctx, client, responses }) => {
  const codeVerifier = _generateCodeVerifier()
  const codeChallenge = _generateCodeChallenge(codeVerifier)

  await client.setState({
    type: 'integration',
    name: 'oauthPkce',
    id: ctx.integrationId,
    payload: { codeVerifier, createdAt: new Date().toISOString() },
  })

  return responses.redirectToExternalUrl(_buildAirtableAuthorizeUrl({ codeChallenge, webhookId: ctx.webhookId }))
}

const _oauthCallbackHandler: WizardHandler = async ({ req, ctx, client, logger, responses, query }) => {
  const code = query.get('code') ?? new URLSearchParams(req.query).get('code')
  if (!code) {
    return responses.endWizard({ success: false, errorMessage: 'Airtable did not return an authorization code' })
  }

  const { state: pkceState } = await client.getState({
    type: 'integration',
    id: ctx.integrationId,
    name: 'oauthPkce',
  })
  const codeVerifier = pkceState.payload.codeVerifier

  const oauth = new AirtableOAuthClient({ client, ctx, logger })
  await oauth.requestShortLivedCredentials.fromAuthorizationCode(code, codeVerifier, _getRedirectUri())

  return responses.redirectToStep('pick-base')
}

const _pickBaseHandler: WizardHandler = async ({ ctx, client, logger, responses }) => {
  const oauth = new AirtableOAuthClient({ client, ctx, logger })
  const { accessToken } = await oauth.getAuthState()

  const response = await axios.get<{ bases: Array<{ id: string; name: string; permissionLevel: string }> }>(
    'https://api.airtable.com/v0/meta/bases',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  const bases = response.data.bases ?? []
  if (bases.length === 0) {
    return responses.endWizard({
      success: false,
      errorMessage: 'No Airtable bases were found for this account',
    })
  }

  return responses.displayChoices({
    pageTitle: 'Select an Airtable Base',
    htmlOrMarkdownPageContents: 'Pick the base you want this integration to use.',
    choices: bases.map((base) => ({ label: base.name, value: base.id })),
    nextStepId: 'save-base',
  })
}

const _saveBaseHandler: WizardHandler = async ({ ctx, client, selectedChoice, responses }) => {
  if (!selectedChoice) {
    return responses.redirectToStep('pick-base')
  }

  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: { baseId: selectedChoice },
  })

  return responses.endWizard({ success: true })
}

const _getManualCredentialsHandler: WizardHandler = ({ responses }) => {
  return responses.displayForm(_manualCredentialsForm)
}

const _saveManualCredentialsHandler: WizardHandler = async ({ ctx, client, logger, formValues, responses }) => {
  if (!formValues) {
    return responses.redirectToStep('get-manual-credentials')
  }

  const parsed = _manualCredentialsSchema.safeParse(formValues)
  if (!parsed.success) {
    return responses.displayForm({
      ..._manualCredentialsForm,
      errors: parsed.error,
      previousValues: formValues as z.input<typeof _manualCredentialsSchema>,
    })
  }

  const { personalAccessToken, baseId, endpointUrl } = parsed.data

  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: { baseId, endpointUrl: endpointUrl || undefined },
  })

  const oauth = new AirtableOAuthClient({ client, ctx, logger })
  await oauth.savePersonalAccessToken(personalAccessToken)

  return responses.endWizard({ success: true })
}
