import { generateRawHtmlDialog } from '@botpress/common/src/html-dialogs'
import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { exchangeCodeForOAuthCredentials, setOAuthCredentials, getAccessToken } from '../../auth'
import { getHitlClient } from '../../hitl/client'
import { createHitlChannel, connectHitlChannel } from '../../hitl/setup'
import { HubspotClient } from '../../hubspot-api'
import * as bp from '.botpress'

const REDIRECT_URI = `${process.env.BP_WEBHOOK_URL}/oauth`

const CRM_SCOPES = [
  'oauth',
  'crm.objects.contacts.read',
  'crm.objects.contacts.write',
  'tickets',
  'crm.objects.owners.read',
  'crm.objects.companies.read',
  'crm.objects.companies.write',
  'crm.objects.leads.read',
  'crm.objects.leads.write',
  'crm.objects.deals.read',
  'crm.objects.deals.write',
]

const HITL_SCOPES = [
  'conversations.custom_channels.read',
  'conversations.custom_channels.write',
  'conversations.read',
  'conversations.write',
  'conversations.visitor_identification.tokens.create',
]

const _startStep: oauthWizard.WizardStepHandler<bp.HandlerProps> = async ({ selectedChoice, client, ctx, responses }) => {
  if (selectedChoice) {
    const enableHitl = selectedChoice === 'with-hitl'
    await client.setState({
      type: 'integration',
      name: 'hitlSetupWizard',
      id: ctx.integrationId,
      payload: { enableHitl },
    })
    return responses.redirectToStep('oauth-redirect')
  }

  const previouslyEnabledHitl = await client
    .getState({ type: 'integration', name: 'hitlSetupWizard', id: ctx.integrationId })
    .then((s) => s.state.payload.enableHitl ?? false)
    .catch(() => false)

  return responses.displayChoices({
    pageTitle: 'Connect HubSpot',
    htmlOrMarkdownPageContents:
      'Choose how you want to connect HubSpot.\n\n' +
      'HITL (Human-in-the-Loop) lets your agents handle conversations directly from HubSpot. ' +
      'It requires a Help Desk or Conversations Inbox in your HubSpot account.',
    choices: [
      { label: 'Connect to HubSpot (CRM only)', value: 'without-hitl' },
      { label: 'Connect to HubSpot with HITL (Human-in-the-Loop)', value: 'with-hitl' },
    ],
    nextStepId: 'start',
    defaultValues: [previouslyEnabledHitl ? 'with-hitl' : 'without-hitl'],
  })
}

const _oauthRedirectStep: oauthWizard.WizardStepHandler<bp.HandlerProps> = async ({ ctx, client, responses }) => {
  const hitlSetupWizardState = await client
    .getState({ type: 'integration', name: 'hitlSetupWizard', id: ctx.integrationId })
    .catch(() => null)

  const enableHitl = hitlSetupWizardState?.state?.payload?.enableHitl ?? false
  const scopes = enableHitl ? [...CRM_SCOPES, ...HITL_SCOPES] : CRM_SCOPES
  const scopesStr = encodeURIComponent(scopes.join(' '))

  const url =
    `https://app.hubspot.com/oauth/authorize` +
    `?client_id=${bp.secrets.CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&state=${ctx.webhookId}` +
    `&scope=${scopesStr}`

  return responses.redirectToExternalUrl(url)
}

const _oauthCallbackStep: oauthWizard.WizardStepHandler<bp.HandlerProps> = async ({
  ctx,
  client,
  logger,
  query,
  responses,
}) => {
  const error = query.get('error')
  if (error) {
    const description = query.get('error_description') ?? ''
    return responses.endWizard({ success: false, errorMessage: `OAuth error: ${error} - ${description}` })
  }

  const code = query.get('code')
  if (!code) {
    return responses.endWizard({ success: false, errorMessage: 'Authorization code not present in OAuth callback' })
  }

  const credentials = await exchangeCodeForOAuthCredentials({ code })
  await setOAuthCredentials({ client, ctx, credentials })

  const hitlSetupWizardState = await client
    .getState({ type: 'integration', name: 'hitlSetupWizard', id: ctx.integrationId })
    .catch(() => null)

  const enableHitl = hitlSetupWizardState?.state?.payload?.enableHitl ?? false

  if (enableHitl) {
    return responses.redirectToStep('hitl-inbox-id')
  }

  const hsClient = new HubspotClient({ accessToken: credentials.accessToken, client, ctx, logger })
  const hubId = await hsClient.getHubId()
  await client.configureIntegration({ identifier: hubId })
  return responses.endWizard({ success: true })
}

const _hitlInboxIdStep: oauthWizard.WizardStepHandler<bp.HandlerProps> = async ({
  ctx,
  client,
  logger,
  selectedChoices,
  responses,
}) => {
  if (selectedChoices) {
    const { state } = await client.getState({ type: 'integration', name: 'hitlSetupWizard', id: ctx.integrationId })
    await client.setState({
      type: 'integration',
      name: 'hitlSetupWizard',
      id: ctx.integrationId,
      payload: { ...state.payload, selectedInboxIds: selectedChoices },
    })

    if (selectedChoices.length > 1) {
      return responses.redirectToStep('hitl-default-inbox')
    }

    await client.setState({
      type: 'integration',
      name: 'hitlSetupWizard',
      id: ctx.integrationId,
      payload: { ...state.payload, selectedInboxIds: selectedChoices, defaultInboxId: selectedChoices[0] },
    })
    return responses.redirectToStep('hitl-setup')
  }

  const hitlClient = getHitlClient(ctx, client, logger)
  let inboxes: Array<{ id: string; name: string }> = []
  try {
    inboxes = await hitlClient.listInboxes()
  } catch {
    logger.forBot().warn('Failed to fetch HubSpot inboxes')
  }

  const inboxTypeExplanation =
    'Botpress HITL supports two inbox types:\n- Conversations Inbox\n- Help Desk'

  if (inboxes.length === 0) {
    return responses.displayButtons({
      pageTitle: 'Select HubSpot Inboxes',
      htmlOrMarkdownPageContents:
        'No inboxes found in your HubSpot account.\n\n' +
        inboxTypeExplanation +
        '\n\nCreate an inbox in HubSpot, then click Refresh to continue.',
      buttons: [{ label: 'Refresh', buttonType: 'primary', action: 'navigate', navigateToStep: 'hitl-inbox-id' }],
    })
  }

  const previouslyConnectedInboxIds = await client
    .getState({ type: 'integration', name: 'hitlConfig', id: ctx.integrationId })
    .then((s) => Object.keys(s.state.payload.channelAccounts ?? {}))
    .catch(() => [])

  return responses.displayChoices({
    pageTitle: 'Select HubSpot Inboxes',
    htmlOrMarkdownPageContents:
      'Select one or more inboxes where HITL conversations will be routed.\n\n' +
      inboxTypeExplanation,
    choices: inboxes.map((inbox) => ({ label: `${inbox.name} (ID: ${inbox.id})`, value: inbox.id })),
    nextStepId: 'hitl-inbox-id',
    multiple: true,
    defaultValues: previouslyConnectedInboxIds,
  })
}

const _hitlDefaultInboxStep: oauthWizard.WizardStepHandler<bp.HandlerProps> = async ({
  ctx,
  client,
  logger,
  selectedChoice,
  responses,
}) => {
  const { state } = await client.getState({ type: 'integration', name: 'hitlSetupWizard', id: ctx.integrationId })
  const selectedInboxIds: string[] = state.payload.selectedInboxIds ?? []

  if (selectedChoice) {
    await client.setState({
      type: 'integration',
      name: 'hitlSetupWizard',
      id: ctx.integrationId,
      payload: { ...state.payload, defaultInboxId: selectedChoice },
    })
    return responses.redirectToStep('hitl-setup')
  }

  const hitlClient = getHitlClient(ctx, client, logger)
  let inboxes: Array<{ id: string; name: string }> = []
  try {
    inboxes = await hitlClient.listInboxes()
  } catch {
    logger.forBot().warn('Failed to fetch HubSpot inboxes for default selection')
  }

  const choices = selectedInboxIds.map((id) => {
    const inbox = inboxes.find((i) => i.id === id)
    return { label: `${inbox?.name ?? 'Unknown'} (ID: ${id})`, value: id }
  })

  const previousDefaultInboxId = await client
    .getState({ type: 'integration', name: 'hitlConfig', id: ctx.integrationId })
    .then((s) => s.state.payload.defaultInboxId)
    .catch(() => undefined)

  return responses.displayChoices({
    pageTitle: 'Select Default Inbox',
    htmlOrMarkdownPageContents:
      'You selected multiple inboxes. Choose which one will be used by default when no inbox is specified.',
    choices,
    nextStepId: 'hitl-default-inbox',
    defaultValues: previousDefaultInboxId ? [previousDefaultInboxId] : undefined,
  })
}

const _hitlSetupStep: oauthWizard.WizardStepHandler<bp.HandlerProps> = async ({ ctx, client, logger, responses }) => {
  const { state } = await client.getState({ type: 'integration', name: 'hitlSetupWizard', id: ctx.integrationId })
  const { selectedInboxIds, defaultInboxId } = state.payload

  if (!selectedInboxIds?.length || !defaultInboxId) {
    return responses.endWizard({ success: false, errorMessage: 'Inbox selection not found in configuration state' })
  }

  const appId = bp.secrets.APP_ID
  if (!appId) {
    return responses.endWizard({ success: false, errorMessage: 'APP_ID secret is not configured' })
  }

  const channelId = await createHitlChannel({
    ctx,
    client,
    logger,
    appId,
    developerApiKey: bp.secrets.DEVELOPER_API_KEY,
  })

  await client.setState({
    type: 'integration',
    name: 'hitlSetupWizard',
    id: ctx.integrationId,
    payload: { ...state.payload, channelId },
  })

  return responses.redirectToStep('creating-channel')
}

const _MAX_CHANNEL_ATTEMPTS = 10

const _creatingChannelStep: oauthWizard.WizardStepHandler<bp.HandlerProps> = async ({
  ctx,
  client,
  logger,
  query,
  responses,
}) => {
  const attempt = parseInt(query.get('wizattempt') ?? '0', 10)

  if (attempt >= _MAX_CHANNEL_ATTEMPTS) {
    return responses.endWizard({
      success: false,
      errorMessage: `Channel creation timed out after ${_MAX_CHANNEL_ATTEMPTS} attempts. Please try again.`,
    })
  }

  const { state } = await client.getState({ type: 'integration', name: 'hitlSetupWizard', id: ctx.integrationId })
  const { channelId, selectedInboxIds, defaultInboxId } = state.payload

  if (!channelId || !selectedInboxIds?.length || !defaultInboxId) {
    return responses.endWizard({ success: false, errorMessage: 'Missing channel or inbox configuration in state' })
  }

  const appId = bp.secrets.APP_ID
  const hitlClient = getHitlClient(ctx, client, logger)
  const { results } = await hitlClient.getCustomChannels(appId, bp.secrets.DEVELOPER_API_KEY)
  const isAvailable = results.some((c) => c.id === channelId)

  if (isAvailable) {
    await connectHitlChannel({ ctx, client, logger, channelId, inboxIds: selectedInboxIds, defaultInboxId })
    const accessToken = await getAccessToken({ client, ctx })
    const hsClient = new HubspotClient({ accessToken, client, ctx, logger })
    const hubId = await hsClient.getHubId()
    await client.configureIntegration({ identifier: hubId })
    return responses.endWizard({ success: true })
  }

  const delaySecs = Math.pow(2, attempt)
  const nextUrl = new URL(
    `/oauth/wizard/creating-channel?state=${ctx.webhookId}&wizattempt=${attempt + 1}`,
    process.env.BP_WEBHOOK_URL
  )

  return generateRawHtmlDialog({
    pageTitle: 'Creating HubSpot Custom Channel',
    bodyHtml: `
      <meta http-equiv="refresh" content="${delaySecs};url=${nextUrl}">
      <div class="d-flex flex-column align-items-center justify-content-center vh-100 gap-3">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="text-muted">Creating your HubSpot custom channel… (attempt ${attempt + 1} of ${_MAX_CHANNEL_ATTEMPTS})</p>
      </div>
    `,
  })
}

export const buildOAuthWizard = (props: bp.HandlerProps) =>
  new oauthWizard.OAuthWizardBuilder(props)
    .addStep({ id: 'start', handler: _startStep })
    .addStep({ id: 'oauth-redirect', handler: _oauthRedirectStep })
    .addStep({ id: 'oauth-callback', handler: _oauthCallbackStep })
    .addStep({ id: 'hitl-inbox-id', handler: _hitlInboxIdStep })
    .addStep({ id: 'hitl-default-inbox', handler: _hitlDefaultInboxStep })
    .addStep({ id: 'hitl-setup', handler: _hitlSetupStep })
    .addStep({ id: 'creating-channel', handler: _creatingChannelStep })
    .build()
