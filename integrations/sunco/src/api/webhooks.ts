import * as sdk from '@botpress/sdk'
import { OAuthCredentials } from 'src/types'
import { BASE_HEADERS } from './const'
import * as bp from '.botpress'

const { z } = sdk

const createWebhookSchema = z.object({ webhook: z.object({ secret: z.string(), id: z.string() }) }).passthrough()

const listWebhooksSchema = z.object({ webhooks: z.array(z.object({ id: z.string() })) }).passthrough()

export const createWebhook = async ({
  credentials,
  logger,
  webhookUrl,
}: {
  credentials: OAuthCredentials
  logger: bp.Logger
  webhookUrl: string
}): Promise<sdk.z.infer<typeof createWebhookSchema>['webhook']> => {
  logger.forBot().debug('Creating webhook')

  if (!credentials.subdomain) {
    throw new sdk.RuntimeError('failed to register webhook: no subdomain is associated with this bot installation')
  }

  const params = {
    target: webhookUrl,
    triggers: ['conversation:message', 'conversation:postback', 'conversation:create'],
  }

  const response = await fetch(
    `https://${credentials.subdomain}.zendesk.com/sc/v2/apps/${credentials.appId}/integrations/me/webhooks`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${credentials.token}`, ...BASE_HEADERS },
      body: JSON.stringify(params),
    }
  )

  const payload = await response.json()
  if (!response.ok) {
    logger.forBot().error('Failed to register webhook', { status: response.status, payload })
    throw new sdk.RuntimeError('failed to register webhook')
  }

  const webhook = createWebhookSchema.parse(payload)

  logger.forBot().debug('Successfully registered webhook for SunCo')

  return webhook.webhook
}

export const deleteApp = async ({ credentials, logger }: { credentials: OAuthCredentials; logger: bp.Logger }) => {
  logger.forBot().debug(`Deleting app with ID ${credentials.appId}`)

  if (!credentials.subdomain) {
    throw new sdk.RuntimeError('Failed to delete app: no subdomain is associated with this bot installation')
  }

  await _deleteAllWebhooks({ credentials, logger })

  const response = await fetch(`https://${credentials.subdomain}.zendesk.com/sc/oauth/authorization`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${credentials.token}`, ...BASE_HEADERS },
  })

  const payload = await response.json()
  if (!response.ok) {
    logger.forBot().error('Failed to delete app', { status: response.status, payload })
    throw new sdk.RuntimeError('Failed to delete app')
  }
  logger.forBot().debug('Successfully deleted SunCo app')
}

const _deleteAllWebhooks = async ({ credentials, logger }: { credentials: OAuthCredentials; logger: bp.Logger }) => {
  const webhooks = await _listWebhooks({ credentials, logger })
  for (const { id } of webhooks) {
    await _deleteWebhook({ credentials, logger, webhookId: id })
  }
}

const _deleteWebhook = async ({
  credentials,
  logger,
  webhookId,
}: {
  credentials: OAuthCredentials
  logger: bp.Logger
  webhookId: string
}) => {
  if (!credentials.subdomain) {
    throw new sdk.RuntimeError(
      `Failed to delete webhook with ID ${webhookId} : no subdomain is associated with this bot installation`
    )
  }

  const response = await fetch(
    `https://${credentials.subdomain}.zendesk.com/sc/v2/apps/${credentials.appId}/integrations/me/webhooks/${webhookId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${credentials.token}`, ...BASE_HEADERS },
    }
  )

  if (!response.ok) {
    logger.forBot().error('Failed to delete webhook', { status: response.status, payload: await response.json() })
    throw new sdk.RuntimeError('failed to delete webhook')
  }
}

const _listWebhooks = async ({ credentials, logger }: { credentials: OAuthCredentials; logger: bp.Logger }) => {
  logger.forBot().debug('Listing webhooks')

  if (!credentials.subdomain) {
    throw new sdk.RuntimeError('failed to list webhooks: no subdomain is associated with this bot installation')
  }

  const response = await fetch(
    `https://${credentials.subdomain}.zendesk.com/sc/v2/apps/${credentials.appId}/integrations/me/webhooks`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${credentials.token}`, ...BASE_HEADERS },
    }
  )

  const payload = await response.json()
  if (!response.ok) {
    logger.forBot().error('Failed to list webhooks', { status: response.status, payload })
    throw new sdk.RuntimeError('Failed to list webhooks')
  }

  const parsed = listWebhooksSchema.parse(payload)
  logger.forBot().debug('Successfully listed webhooks for SunCo')
  return parsed.webhooks
}
