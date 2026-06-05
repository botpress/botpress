import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { z } from '@botpress/sdk'
import { LinearClient } from '@linear/sdk'
import { LinearOauthClient, registerWebhook } from './misc/linear'
import { useDeskOAuth } from './misc/utils'
import * as bp from '.botpress'

const REDIRECT_URI = `${process.env.BP_WEBHOOK_URL}/oauth`
const APP_SCOPES = 'read,write,issues:create,comments:create'
const ADMIN_SCOPES = 'read,write,admin,issues:create,comments:create'

const _buildAuthorizeUrl = ({
  clientId,
  actor,
  scopes,
  state,
}: {
  clientId: string
  actor: 'user' | 'app'
  scopes: string
  state: string
}) =>
  'https://linear.app/oauth/authorize' +
  `?client_id=${clientId}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  '&response_type=code' +
  '&prompt=consent' +
  `&actor=${actor}` +
  `&state=${state}` +
  `&scope=${scopes}`

const _startStep: oauthWizard.WizardStepHandler<bp.HandlerProps> = async ({ ctx, client, query, responses }) => {
  const searchParams = new URLSearchParams(query)
  const payload = {
    source: searchParams.get('source') ?? undefined,
    env: z.enum(['preview', 'production']).catch('preview').parse(searchParams.get('env')),
    wizardPhase: 'admin',
  } as bp.states.environment.Environment['payload']

  await client.setState({
    type: 'integration',
    name: 'environment',
    id: ctx.integrationId,
    payload,
  })

  const isDesk = useDeskOAuth(payload)
  const clientId = isDesk ? bp.secrets.DESK_CLIENT_ID : bp.secrets.CLIENT_ID

  return responses.redirectToExternalUrl(
    _buildAuthorizeUrl({ clientId, actor: 'user', scopes: ADMIN_SCOPES, state: ctx.webhookId })
  )
}

const _oauthCallbackStep: oauthWizard.WizardStepHandler<bp.HandlerProps> = async ({
  ctx,
  client,
  logger,
  query,
  responses,
  setIntegrationIdentifier,
}) => {
  const {
    state: { payload: environment },
  } = await client.getState({
    type: 'integration',
    name: 'environment',
    id: ctx.integrationId,
  })

  const error = query.get('error')
  if (error) {
    if (environment.wizardPhase !== 'app') {
      const description = query.get('error_description') ?? ''
      return responses.endWizard({ success: false, errorMessage: `OAuth error: ${error} - ${description}` })
    }
    return responses.displayButtons({
      pageTitle: 'Use user actor?',
      buttons: [
        { action: 'navigate', label: 'Yes', buttonType: 'success', navigateToStep: 'use-user-actor' },
        { action: 'close', label: 'No', buttonType: 'danger' },
      ],
      htmlOrMarkdownPageContents:
        'Failed to obtain app credentials. Do you want to use user credentials for creating issues and comments?',
    })
  }

  const code = query.get('code')
  if (!code) {
    return responses.endWizard({ success: false, errorMessage: 'Authorization code not present in OAuth callback' })
  }

  const useDesk = useDeskOAuth(environment)
  const linearOauthClient = new LinearOauthClient(useDesk)
  const tokenActor = environment.wizardPhase === 'app' ? 'app' : 'user'
  const credentials = await linearOauthClient.getAccessTokenFromOAuthCode(code, tokenActor)

  if (environment.wizardPhase === 'app') {
    logger.forBot().info('Received app-actor OAuth callback, saving runtime credentials...')
    await client.setState({
      type: 'integration',
      name: 'credentials',
      id: ctx.integrationId,
      payload: credentials,
    })

    const linearClient = new LinearClient({ accessToken: credentials.accessToken })
    const organization = await linearClient.organization
    setIntegrationIdentifier(organization.id)
    return responses.endWizard({ success: true })
  }

  logger.forBot().info('Received user-actor OAuth callback, saving admin credentials...')
  await client.setState({
    type: 'integration',
    name: 'adminCredentials',
    id: ctx.integrationId,
    payload: credentials,
  })

  const linearClient = new LinearClient({ accessToken: credentials.accessToken })
  const webhookUrl = `${process.env.BP_WEBHOOK_URL}/${ctx.webhookId}`
  try {
    await registerWebhook({ linearClient, logger, url: webhookUrl })
  } catch (thrown) {
    const errorMessage = thrown instanceof Error ? thrown.message : String(thrown)
    logger.forBot().warn('Failed to register webhook:', errorMessage)
  }

  await client.setState({
    type: 'integration',
    name: 'environment',
    id: ctx.integrationId,
    payload: { ...environment, wizardPhase: 'app' },
  })

  const clientId = useDesk ? bp.secrets.DESK_CLIENT_ID : bp.secrets.CLIENT_ID
  const res = responses.redirectToExternalUrl(
    _buildAuthorizeUrl({
      clientId,
      actor: 'app',
      scopes: APP_SCOPES,
      state: ctx.webhookId,
    })
  )
  logger.debug(res.body)
  logger.debug(JSON.stringify(res.headers, null, 2))
  logger.debug(res.status)
  return res
}

const _useUserActorStep: oauthWizard.WizardStepHandler<bp.HandlerProps> = async ({
  ctx,
  client,
  responses,
  setIntegrationIdentifier,
}) => {
  const {
    state: { payload: adminCreds },
  } = await client.getState({
    type: 'integration',
    name: 'adminCredentials',
    id: ctx.integrationId,
  })

  const linearClient = new LinearClient({ accessToken: adminCreds.accessToken })
  const organization = await linearClient.organization
  setIntegrationIdentifier(organization.id)

  await client.setState({
    type: 'integration',
    name: 'credentials',
    id: ctx.integrationId,
    payload: adminCreds,
  })
  return responses.endWizard({ success: true })
}

export const buildOAuthWizard = (props: bp.HandlerProps) =>
  new oauthWizard.OAuthWizardBuilder(props)
    .addStep({ id: 'start', handler: _startStep })
    .addStep({ id: 'oauth-callback', handler: _oauthCallbackStep })
    .addStep({ id: 'use-user-actor', handler: _useUserActorStep })
    .build()
