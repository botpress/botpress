import * as oauthWizard from '@botpress/common/src/oauth-wizard'
import { z } from '@botpress/sdk'
import { LinearClient } from '@linear/sdk'
import { LinearOauthClient, registerWebhook } from './misc/linear'
import { useDeskOAuth } from './misc/utils'
import * as bp from '.botpress'

const REDIRECT_URI = `${process.env.BP_WEBHOOK_URL}/oauth`
const SCOPES = 'read,write,issues:create,comments:create,admin'

const _startStep: oauthWizard.WizardStepHandler<bp.HandlerProps> = async ({ ctx, client, query, responses }) => {
  const searchParams = new URLSearchParams(query)
  const payload = {
    source: searchParams.get('source') ?? undefined,
    env: z.enum(['preview', 'production']).catch('preview').parse(searchParams.get('env')),
  } as bp.states.environment.Environment['payload']

  await client.setState({
    type: 'integration',
    name: 'environment',
    id: ctx.integrationId,
    payload,
  })

  const isDesk = useDeskOAuth(payload)
  const clientId = isDesk ? bp.secrets.DESK_CLIENT_ID : bp.secrets.CLIENT_ID
  const actor = isDesk ? 'user' : 'application'
  const authorizeUrl =
    'https://linear.app/oauth/authorize' +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    '&response_type=code' +
    '&prompt=consent' +
    `&actor=${actor}` +
    `&state=${ctx.webhookId}` +
    `&scope=${SCOPES}`

  return responses.redirectToExternalUrl(authorizeUrl)
}

const _oauthCallbackStep: oauthWizard.WizardStepHandler<bp.HandlerProps> = async ({
  ctx,
  client,
  logger,
  query,
  responses,
  setIntegrationIdentifier,
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

  const {
    state: { payload: environment },
  } = await client.getState({
    type: 'integration',
    name: 'environment',
    id: ctx.integrationId,
  })
  const useDesk = useDeskOAuth(environment)
  const linearOauthClient = new LinearOauthClient(useDesk)
  const credentials = await linearOauthClient.getAccessTokenFromOAuthCode(code)
  logger.forBot().info('Obtained credentials from OAuth flow, saving to state...')
  await client.setState({
    type: 'integration',
    name: 'credentials',
    id: ctx.integrationId,
    payload: credentials,
  })

  const linearClient = new LinearClient({ accessToken: credentials.accessToken })
  const organization = await linearClient.organization

  const webhookUrl = `${process.env.BP_WEBHOOK_URL}/${ctx.webhookId}`
  try {
    await registerWebhook({ linearClient, logger, url: webhookUrl })
  } catch (thrown) {
    const errorMessage = thrown instanceof Error ? thrown.message : String(thrown)
    logger.forBot().warn('Failed to register webhook:', errorMessage)
  }

  setIntegrationIdentifier(organization.id)
  return responses.endWizard({ success: true })
}

export const buildOAuthWizard = (props: bp.HandlerProps) =>
  new oauthWizard.OAuthWizardBuilder(props)
    .addStep({ id: 'start', handler: _startStep })
    .addStep({ id: 'oauth-callback', handler: _oauthCallbackStep })
    .build()
