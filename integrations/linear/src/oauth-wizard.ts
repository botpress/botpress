import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { z } from '@botpress/sdk'
import { LinearClient } from '@linear/sdk'
import { LinearOauthClient, registerWebhook } from './misc/linear'
import { useDeskOAuth } from './misc/utils'
import * as bp from '.botpress'

const REDIRECT_URI = `${process.env.BP_WEBHOOK_URL}/oauth`
const APP_SCOPES = 'read,write,issues:create,comments:create'
const ADMIN_SCOPES = 'read,write,admin,issues:create,comments:create'
const USER_ACTOR_FALLBACK_STEP = 'use-user-actor'

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

const _saveUserActorRuntimeCredentials = async ({
  ctx,
  client,
  responses,
  setIntegrationIdentifier,
}: Pick<bp.HandlerProps, 'ctx' | 'client'> &
  Pick<oauthWizard.WizardStepInputProps, 'responses' | 'setIntegrationIdentifier'>) => {
  const {
    state: { payload: environment },
  } = await client.getState({
    type: 'integration',
    name: 'environment',
    id: ctx.integrationId,
  })
  const {
    state: { payload: adminCredentials },
  } = await client.getState({
    type: 'integration',
    name: 'adminCredentials',
    id: ctx.integrationId,
  })

  if (!adminCredentials.accessToken) {
    return responses.endWizard({
      success: false,
      errorMessage: 'Cannot install with user actor because user OAuth credentials are missing.',
    })
  }

  const linearClient = new LinearClient({ accessToken: adminCredentials.accessToken })
  await client.setState({
    type: 'integration',
    name: 'credentials',
    id: ctx.integrationId,
    payload: adminCredentials,
  })
  await client.setState({
    type: 'integration',
    name: 'environment',
    id: ctx.integrationId,
    payload: { ...environment, runtimeActor: 'user' },
  })

  const organization = await linearClient.organization
  setIntegrationIdentifier(organization.id)
  return responses.endWizard({ success: true })
}

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
    const description = query.get('error_description') ?? ''
    if (environment.wizardPhase === 'app') {
      logger.forBot().warn(`Linear app-actor OAuth failed (${error}: ${description}). Asking for user-actor fallback.`)
      return responses.displayButtons({
        pageTitle: 'Linear app authorization failed',
        htmlOrMarkdownPageContents:
          'You can continue without automatic webhooks. Botpress will still be able to call Linear using your account, but Linear events will not be sent back to Botpress unless webhooks are configured by a workspace admin.',
        buttons: [
          {
            label: 'Install without webhooks',
            buttonType: 'primary',
            action: 'navigate',
            navigateToStep: USER_ACTOR_FALLBACK_STEP,
          },
          {
            label: 'Cancel',
            buttonType: 'secondary',
            action: 'close',
          },
        ],
      })
    }
    return responses.endWizard({ success: false, errorMessage: `OAuth error: ${error} - ${description}` })
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
    await client.setState({
      type: 'integration',
      name: 'environment',
      id: ctx.integrationId,
      payload: { ...environment, runtimeActor: 'app' },
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
  return responses.redirectToExternalUrl(
    _buildAuthorizeUrl({
      clientId,
      actor: 'app',
      scopes: APP_SCOPES,
      state: ctx.webhookId,
    })
  )
}

const _useUserActorStep: oauthWizard.WizardStepHandler<bp.HandlerProps> = async ({
  ctx,
  client,
  responses,
  setIntegrationIdentifier,
}) =>
  _saveUserActorRuntimeCredentials({
    ctx,
    client,
    responses,
    setIntegrationIdentifier,
  })

export const buildOAuthWizard = (props: bp.HandlerProps) =>
  new oauthWizard.OAuthWizardBuilder(props)
    .addStep({ id: 'start', handler: _startStep })
    .addStep({ id: 'oauth-callback', handler: _oauthCallbackStep })
    .addStep({ id: USER_ACTOR_FALLBACK_STEP, handler: _useUserActorStep })
    .build()
