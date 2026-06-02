import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { Response, z } from '@botpress/sdk'
import { StripeOAuthClient } from '../stripe-api/stripe-oauth-client'
import * as bp from '.botpress'

type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>

const _getRedirectUri = () => `${process.env.BP_WEBHOOK_URL}/oauth/wizard/oauth-callback`

const _buildStripeAuthorizeUrl = ({ webhookId }: { webhookId: string }): string => {
  const params = new URLSearchParams({
    client_id: bp.secrets.CLIENT_ID,
    redirect_uri: _getRedirectUri(),
    response_type: 'code',
    state: webhookId,
  })
  return `https://marketplace.stripe.com/oauth/v2/authorize?${params.toString()}`
}

const _manualCredentialsSchema = z.object({
  apiKey: z
    .string()
    .secret()
    .min(1)
    .title('Stripe API Key')
    .describe('Your Stripe Secret Key (sk_live_/sk_test_) or a Restricted Key'),
})

const _manualCredentialsForm = {
  pageTitle: 'Stripe API Key',
  htmlOrMarkdownPageContents:
    'Enter a Stripe Secret Key (or Restricted Key). You can create one at <a href="https://dashboard.stripe.com/apikeys" target="_blank">https://dashboard.stripe.com/apikeys</a>.',
  schema: _manualCredentialsSchema,
  nextStepId: 'save-manual-credentials',
}

export const handler = async (props: bp.HandlerProps): Promise<Response> => {
  const wizard = new oauthWizard.OAuthWizardBuilder(props)
    .addStep({ id: 'start', handler: _startHandler })
    .addStep({ id: 'route-choice', handler: _routeChoiceHandler })
    .addStep({ id: 'oauth-redirect', handler: _oauthRedirectHandler })
    .addStep({ id: 'oauth-callback', handler: _oauthCallbackHandler })
    .addStep({ id: 'get-manual-credentials', handler: _getManualCredentialsHandler })
    .addStep({ id: 'save-manual-credentials', handler: _saveManualCredentialsHandler })
    .build()

  return await wizard.handleRequest()
}

const _startHandler: WizardHandler = ({ responses }) => {
  return responses.displayChoices({
    pageTitle: 'Stripe Integration Setup',
    htmlOrMarkdownPageContents: 'Choose how you would like to configure your Stripe integration:',
    choices: [
      { label: 'Connect with OAuth', value: 'oauth' },
      { label: 'Use a Stripe API Key', value: 'manual' },
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

const _oauthRedirectHandler: WizardHandler = async ({ ctx, responses }) => {
  return responses.redirectToExternalUrl(_buildStripeAuthorizeUrl({ webhookId: ctx.webhookId }))
}

const _oauthCallbackHandler: WizardHandler = async ({ ctx, client, logger, responses, query }) => {
  const code = query.get('code')
  if (!code) {
    return responses.endWizard({ success: false, errorMessage: 'Stripe did not return an authorization code' })
  }

  const state = query.get('state')
  if (!state || state !== ctx.webhookId) {
    return responses.endWizard({ success: false, errorMessage: 'Invalid OAuth state parameter' })
  }

  const oauth = new StripeOAuthClient({ client, ctx, logger })
  await oauth.requestShortLivedCredentials.fromAuthorizationCode(code)

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

  const oauth = new StripeOAuthClient({ client, ctx, logger })
  await oauth.saveManualApiKey(parsed.data.apiKey)

  return responses.endWizard({ success: true })
}
