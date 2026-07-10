import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { Response, z } from '@botpress/sdk'
import { exchangeAuthCodeAndSaveRefreshToken } from './google-api/oauth-client'
import * as bp from '.botpress'

type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>

const GOOGLE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
]

const _getRedirectUri = () => `${process.env.BP_WEBHOOK_URL}/oauth/wizard/oauth-callback`

const _buildGoogleAuthorizeUrl = ({ webhookId }: { webhookId: string }): string => {
  const params = new URLSearchParams({
    client_id: bp.secrets.CLIENT_ID,
    redirect_uri: _getRedirectUri(),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: GOOGLE_OAUTH_SCOPES.join(' '),
    state: webhookId,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

const _calendarIdSchema = z.object({
  calendarId: z.string().min(1).title('Calendar ID').describe('The ID of the Google Calendar to interact with.'),
})

const _calendarIdForm = {
  pageTitle: 'Google Calendar Setup',
  htmlOrMarkdownPageContents:
    '1. In Google Calendar, go to <b>Settings</b> and select your calendar.<br>' +
    '2. Scroll to <b>Integrate calendar</b> to find your Calendar ID.<br>' +
    '3. Copy the Calendar ID and paste it below.',
  schema: _calendarIdSchema,
  nextStepId: 'save-calendar-id',
}

export const handler = async (props: bp.HandlerProps): Promise<Response> => {
  const wizard = new oauthWizard.OAuthWizardBuilder(props)
    .addStep({ id: 'start', handler: _startHandler })
    .addStep({ id: 'save-calendar-id', handler: _saveCalendarIdHandler })
    .addStep({ id: 'oauth-callback', handler: _oauthCallbackHandler })
    .build()

  return await wizard.handleRequest()
}

const _startHandler: WizardHandler = ({ responses }) => {
  return responses.displayForm(_calendarIdForm)
}

const _saveCalendarIdHandler: WizardHandler = async ({ ctx, client, formValues, responses }) => {
  if (!formValues) {
    return responses.redirectToStep('start')
  }

  const parsed = _calendarIdSchema.safeParse(formValues)
  if (!parsed.success) {
    return responses.displayForm({
      ..._calendarIdForm,
      errors: parsed.error,
      previousValues: formValues as z.input<typeof _calendarIdSchema>,
    })
  }

  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: { calendarId: parsed.data.calendarId },
  })

  return responses.redirectToExternalUrl(_buildGoogleAuthorizeUrl({ webhookId: ctx.webhookId }))
}

const _oauthCallbackHandler: WizardHandler = async ({ ctx, client, logger, responses, query }) => {
  const oauthError = query.get('error')
  if (oauthError) {
    const description = query.get('error_description')
    return responses.endWizard({
      success: false,
      errorMessage: `Google returned an error: ${oauthError}${description ? ` - ${description}` : ''}`,
    })
  }

  const code = query.get('code')
  if (!code) {
    return responses.endWizard({ success: false, errorMessage: 'Google did not return an authorization code' })
  }

  const state = query.get('state')
  if (!state || state !== ctx.webhookId) {
    return responses.endWizard({ success: false, errorMessage: 'Invalid OAuth state parameter' })
  }

  await exchangeAuthCodeAndSaveRefreshToken({ ctx, client, authorizationCode: code })
  await client.configureIntegration({ identifier: ctx.webhookId })

  logger.forBot().info('Successfully authenticated with Google Calendar')

  return responses.endWizard({ success: true })
}
