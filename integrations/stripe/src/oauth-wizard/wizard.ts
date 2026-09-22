import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { Response, RuntimeError, z } from '@botpress/sdk'
import { StripeClient } from '../stripe-api/stripe-client'
import { StripeOAuthClient, type StripeCredentialsSnapshot } from '../stripe-api/stripe-oauth-client'
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

const _errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error))

const _rollbackCredentials = async ({
  oauth,
  snapshot,
  reason,
}: {
  oauth: StripeOAuthClient
  snapshot: StripeCredentialsSnapshot
  reason: string
}): Promise<string> => {
  try {
    await oauth.restoreCredentials(snapshot)
    return reason
  } catch (error) {
    return `${reason}. The previous Stripe credentials could not be restored either (${_errorMessage(error)}), so the integration may be left partially configured; re-run this wizard`
  }
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

  let snapshot: StripeCredentialsSnapshot
  try {
    snapshot = await oauth.snapshotCredentials()
  } catch (error) {
    return responses.endWizard({
      success: false,
      errorMessage: `Failed to read the existing Stripe credentials: ${_errorMessage(error)}`,
    })
  }

  try {
    await oauth.requestShortLivedCredentials.fromAuthorizationCode(code)
    const { stripeUserId } = await oauth.getAuthState()
    if (!stripeUserId) {
      throw new RuntimeError('Stripe did not return an account id')
    }
    await client.configureIntegration({ identifier: ctx.webhookId })
  } catch (error) {
    return responses.endWizard({
      success: false,
      errorMessage: await _rollbackCredentials({
        oauth,
        snapshot,
        reason: `Failed to connect to Stripe: ${_errorMessage(error)}`,
      }),
    })
  }

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

  try {
    const stripeClient = new StripeClient(parsed.data.apiKey, ctx.configuration.apiVersion)
    await stripeClient.retrieveAccount()
  } catch (error) {
    return responses.endWizard({
      success: false,
      errorMessage: `Failed to validate the Stripe API key: ${_errorMessage(error)}`,
    })
  }

  const oauth = new StripeOAuthClient({ client, ctx, logger })

  let snapshot: StripeCredentialsSnapshot
  try {
    snapshot = await oauth.snapshotCredentials()
  } catch (error) {
    return responses.endWizard({
      success: false,
      errorMessage: `Failed to read the existing Stripe credentials: ${_errorMessage(error)}`,
    })
  }

  try {
    await oauth.saveManualApiKey(parsed.data.apiKey)
    await client.configureIntegration({ identifier: ctx.webhookId })
  } catch (error) {
    return responses.endWizard({
      success: false,
      errorMessage: await _rollbackCredentials({
        oauth,
        snapshot,
        reason: `Failed to save the Stripe credentials: ${_errorMessage(error)}`,
      }),
    })
  }

  return responses.endWizard({ success: true })
}
