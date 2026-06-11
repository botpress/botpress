import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { z, type Response } from '@botpress/sdk'
import { JiraApi } from '../client'
import { JiraOAuthClient } from '../client/auth'
import * as bp from '.botpress'

type WizardHandler = oauthWizard.WizardStepHandler<bp.HandlerProps>

const REQUIRED_JIRA_SCOPES = [
  'read:jira-work',
  'write:jira-work',
  'read:jira-user',
  'manage:jira-project',
  'manage:jira-configuration',
  'offline_access',
]

const OAUTH_SESSION_MAX_AGE_MS = 10 * 60 * 1000 // 10 minutes

const _getRedirectUri = () => oauthWizard.getWizardStepUrl('oauth-callback').toString()

const _manualCredentialsSchema = z.object({
  host: z.string().url().title('Host URL').describe('Jira Cloud host URL, such as https://example.atlassian.net'),
  email: z.string().email().title('Email').describe('Atlassian account email used for Jira API authentication'),
  apiToken: z
    .string()
    .min(1)
    .secret()
    .title('API Token')
    .describe('Atlassian API token used for Jira API authentication'),
})

const _manualCredentialsForm = {
  pageTitle: 'Jira API Token Setup',
  htmlOrMarkdownPageContents:
    'Enter your Jira Cloud host, Atlassian account email, and API token.<br>' +
    'You can create an API token from your Atlassian account security settings.',
  schema: _manualCredentialsSchema,
  nextStepId: 'save-manual-credentials',
}

export const handler = async (props: bp.HandlerProps): Promise<Response> => {
  const wizard = new oauthWizard.OAuthWizardBuilder(props)
    .addStep({ id: 'start', handler: _startHandler })
    .addStep({ id: 'route-choice', handler: _routeChoiceHandler })
    .addStep({ id: 'oauth-redirect', handler: _oauthRedirectHandler })
    .addStep({ id: 'oauth-callback', handler: _oauthCallbackHandler })
    .addStep({ id: 'pick-site', handler: _pickSiteHandler })
    .addStep({ id: 'save-site', handler: _saveSiteHandler })
    .addStep({ id: 'get-manual-credentials', handler: _getManualCredentialsHandler })
    .addStep({ id: 'save-manual-credentials', handler: _saveManualCredentialsHandler })
    .build()

  return await wizard.handleRequest()
}

const _startHandler: WizardHandler = ({ responses }) =>
  responses.displayChoices({
    pageTitle: 'Jira Integration Setup',
    htmlOrMarkdownPageContents: 'Choose how you would like to configure your Jira integration:',
    choices: [
      { label: 'Connect with OAuth', value: 'oauth' },
      { label: 'Use an API Token', value: 'manual' },
    ],
    nextStepId: 'route-choice',
  })

const _routeChoiceHandler: WizardHandler = ({ selectedChoice, responses }) => {
  if (selectedChoice === 'manual') {
    return responses.redirectToStep('get-manual-credentials')
  }
  return responses.redirectToStep('oauth-redirect')
}

const _oauthRedirectHandler: WizardHandler = async ({ ctx, client, responses }) => {
  try {
    await client.setState({
      type: 'integration',
      name: 'oauthSession',
      id: ctx.integrationId,
      payload: { state: ctx.webhookId, createdAt: new Date().toISOString() },
    })

    const params = new URLSearchParams({
      audience: 'api.atlassian.com',
      client_id: bp.secrets.CLIENT_ID,
      scope: REQUIRED_JIRA_SCOPES.join(' '),
      redirect_uri: _getRedirectUri(),
      state: ctx.webhookId,
      response_type: 'code',
      prompt: 'consent',
    })

    return responses.redirectToExternalUrl(`https://auth.atlassian.com/authorize?${params.toString()}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    return responses.endWizard({ success: false, errorMessage: message })
  }
}

const _oauthCallbackHandler: WizardHandler = async ({ ctx, client, logger, responses, query }) => {
  try {
    const error = query.get('error')
    if (error) {
      return responses.endWizard({
        success: false,
        errorMessage: `${error} - ${query.get('error_description') ?? ''}`,
      })
    }

    const code = query.get('code')
    if (!code) {
      return responses.endWizard({ success: false, errorMessage: 'Jira did not return an authorization code' })
    }

    const state = query.get('state')
    const { state: sessionState } = await client.getState({
      type: 'integration',
      name: 'oauthSession',
      id: ctx.integrationId,
    })
    if (!state || state !== ctx.webhookId || sessionState.payload.state !== ctx.webhookId) {
      return responses.endWizard({ success: false, errorMessage: 'Invalid OAuth state parameter' })
    }

    const createdAt = sessionState.payload.createdAt
    if (!createdAt || Date.now() - new Date(createdAt).getTime() > OAUTH_SESSION_MAX_AGE_MS) {
      return responses.endWizard({
        success: false,
        errorMessage: 'OAuth session has expired. Please restart the setup wizard.',
      })
    }

    const oauth = new JiraOAuthClient({ client, ctx, logger })
    await oauth.exchangeAuthorizationCode(code, _getRedirectUri())

    await client.setState({
      type: 'integration',
      name: 'oauthSession',
      id: ctx.integrationId,
      payload: { state: '', createdAt: new Date(0).toISOString() },
    })

    return responses.redirectToStep('pick-site')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    logger.forBot().error(`Jira wizard step failed: ${message}`, { error })
    return responses.endWizard({ success: false, errorMessage: message })
  }
}

const _pickSiteHandler: WizardHandler = async ({ ctx, client, logger, responses }) => {
  try {
    const oauth = new JiraOAuthClient({ client, ctx, logger })
    const accessToken = await oauth.getAccessToken()
    const sites = await oauth.listAccessibleJiraResources(accessToken)

    if (sites.length === 0) {
      return responses.endWizard({
        success: false,
        errorMessage: 'No Jira sites were found for this Atlassian account',
      })
    }

    if (sites.length === 1) {
      const site = sites[0]!
      await _saveOAuthSite({ ctx, client, siteId: site.id, host: site.url })
      await oauth.clearManualCredentials()
      return responses.endWizard({ success: true })
    }

    return responses.displayChoices({
      pageTitle: 'Select a Jira Site',
      htmlOrMarkdownPageContents: 'Pick the Jira site you want this integration to use.',
      choices: sites.map((site) => ({ label: site.name || site.url, value: `${site.id}|${site.url}` })),
      nextStepId: 'save-site',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    logger.forBot().error(`Jira wizard step failed: ${message}`, { error })
    return responses.endWizard({ success: false, errorMessage: message })
  }
}

const _saveSiteHandler: WizardHandler = async ({ ctx, client, logger, selectedChoice, responses }) => {
  try {
    if (!selectedChoice) {
      return responses.redirectToStep('pick-site')
    }

    const [siteId, host] = selectedChoice.split('|')
    if (!siteId || !host) {
      return responses.redirectToStep('pick-site')
    }

    await _saveOAuthSite({ ctx, client, siteId, host })
    const oauth = new JiraOAuthClient({ client, ctx, logger })
    await oauth.clearManualCredentials()
    return responses.endWizard({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    logger.forBot().error(`Jira wizard step failed: ${message}`, { error })
    return responses.endWizard({ success: false, errorMessage: message })
  }
}

const _getManualCredentialsHandler: WizardHandler = ({ responses }) => responses.displayForm(_manualCredentialsForm)

const _saveManualCredentialsHandler: WizardHandler = async ({ ctx, client, logger, formValues, responses }) => {
  try {
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

    const jiraClient = JiraApi.fromBasicAuth(parsed.data.host, parsed.data.email, parsed.data.apiToken)
    try {
      await jiraClient.getCurrentUser()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid Jira credentials'
      const syntheticParse = _manualCredentialsSchema.safeParse({})
      if (!syntheticParse.success) {
        syntheticParse.error.issues = [{ message, path: ['apiToken'], code: 'custom' } satisfies z.ZodIssue]
        return responses.displayForm({
          ..._manualCredentialsForm,
          errors: syntheticParse.error,
          previousValues: parsed.data,
        })
      }
      // Should never reach here since empty object fails validation
      return responses.endWizard({ success: false, errorMessage: message })
    }

    const oauth = new JiraOAuthClient({ client, ctx, logger })
    await oauth.saveManualCredentials(parsed.data)
    await client.setState({
      type: 'integration',
      name: 'configuration',
      id: ctx.integrationId,
      payload: { authType: 'manual', host: parsed.data.host },
    })
    await client.configureIntegration({ identifier: parsed.data.host })

    return responses.endWizard({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    logger.forBot().error(`Jira wizard step failed: ${message}`, { error })
    return responses.endWizard({ success: false, errorMessage: message })
  }
}

const _saveOAuthSite = async ({
  ctx,
  client,
  siteId,
  host,
}: {
  ctx: bp.Context
  client: bp.Client
  siteId: string
  host: string
}) => {
  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: { authType: 'oauth', cloudId: siteId, host },
  })
  await client.configureIntegration({ identifier: host })
}
