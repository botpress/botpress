import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { Response, z } from '@botpress/sdk'
import { REQUIRED_SLACK_SCOPES } from '../setup'
import { handleOAuthCallback } from '../webhook-events/handlers/oauth-callback'
import * as bp from '.botpress'

type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>

const _manualCredentialsSchema = z.object({
  clientId: z.string().title('Slack Client ID').describe('Available in the app admin panel under Basic Info'),
  clientSecret: z
    .string()
    .secret()
    .title('Slack Client Secret')
    .describe('Available in the app admin panel under Basic Info'),
  signingSecret: z
    .string()
    .secret()
    .title('Slack Signing Secret')
    .describe('Available in the app admin panel under Basic Info'),
})

export const handler = async (props: bp.HandlerProps): Promise<Response> => {
  const wizard = new oauthWizard.OAuthWizardBuilder(props)
    .addStep({ id: 'start', handler: _startHandler })
    .addStep({ id: 'get-credentials', handler: _getCredentialsHandler })
    .addStep({ id: 'save-credentials', handler: _saveCredentialsHandler })
    .addStep({ id: 'oauth-callback', handler: _oauthCallbackHandler })
    .addStep({ id: 'end', handler: _endHandler })
    .build()

  return await wizard.handleRequest()
}

const _startHandler: WizardHandler = ({ responses }) => {
  return responses.displayButtons({
    pageTitle: 'Slack Manual Configuration',
    htmlOrMarkdownPageContents:
      'This wizard will guide you through connecting your existing Slack app.<br><br>' +
      'You will need the following from your <a href="https://api.slack.com/apps" target="_blank">Slack app settings</a>:<br>' +
      '- **Signing Secret** (Basic Info)<br>' +
      '- **Client ID** (Basic Info)<br>' +
      '- **Client Secret** (Basic Info)<br><br>' +
      'After providing these credentials, you will be redirected to Slack to authorize the app.',
    buttons: [
      { action: 'navigate', label: 'Continue', navigateToStep: 'get-credentials', buttonType: 'primary' },
      { action: 'close', label: 'Cancel', buttonType: 'secondary' },
    ],
  })
}

const _getCredentialsHandler: WizardHandler = ({ responses }) => {
  return responses.displayForm({
    pageTitle: 'Slack App Credentials',
    htmlOrMarkdownPageContents:
      'Enter your Slack app credentials. You can find these in your <a href="https://api.slack.com/apps" target="_blank">Slack app settings</a>.',
    schema: _manualCredentialsSchema,
    nextStepId: 'save-credentials',
  })
}

const _saveCredentialsHandler: WizardHandler = async ({ ctx, client, responses, formValues }) => {
  if (!formValues) {
    return responses.redirectToStep('get-credentials')
  }

  const parsed = _manualCredentialsSchema.safeParse(formValues)
  if (!parsed.success) {
    return responses.displayForm({
      pageTitle: 'Slack App Credentials',
      htmlOrMarkdownPageContents: 'Some fields are invalid. Please correct them and try again.',
      schema: _manualCredentialsSchema,
      nextStepId: 'save-credentials',
      errors: parsed.error,
      previousValues: formValues as z.input<typeof _manualCredentialsSchema>,
    })
  }

  const { signingSecret, clientId, clientSecret } = parsed.data

  await client.setState({
    type: 'integration',
    id: ctx.integrationId,
    name: 'manualWizardCredentials',
    payload: { signingSecret, clientId, clientSecret },
  })

  const redirectUri = `${process.env.BP_WEBHOOK_URL}/oauth`
  const scopes = REQUIRED_SLACK_SCOPES.join(',')
  const authorizeUrl =
    `https://slack.com/oauth/v2/authorize` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(ctx.webhookId)}`

  return responses.redirectToExternalUrl(authorizeUrl)
}

const _oauthCallbackHandler: WizardHandler = async ({ req, client, ctx, logger, responses }) => {
  await handleOAuthCallback({ req, client, ctx, logger })

  return responses.redirectToStep('end')
}

const _endHandler: WizardHandler = ({ responses }) => {
  return responses.endWizard({ success: true })
}
