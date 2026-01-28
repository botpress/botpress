import * as sdk from '@botpress/sdk'
import { OAuthCredentials, StoredCredentials } from 'src/types'
import * as bp from '.botpress'

const { z } = sdk

const createWebhookSchema = z
  .object({
    webhook: z.object({
      secret: z.string(),
      id: z.string(),
    }),
  })
  .passthrough()

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
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${credentials.token}`,
        'X-Zendesk-Marketplace-Name': bp.secrets.MARKETPLACE_BOT_NAME,
        'X-Zendesk-Marketplace-Organization-Id': bp.secrets.MARKETPLACE_ORG_ID,
      },
      body: JSON.stringify(params),
    }
  )

  if (!response.ok) {
    console.log('error: ', response.json())
    logger.forBot().error('Failed to register webhook', {
      status: response.status,
    })
    throw new sdk.RuntimeError('failed to register webhook')
  }

  const webhook = createWebhookSchema.parse(await response.json())

  logger.forBot().debug('Successfully registered webhook for SunCo')

  return webhook.webhook
}

export const deleteApp = async ({ credentials, logger }: { credentials: OAuthCredentials; logger: bp.Logger }) => {
  logger.forBot().debug(`Deleting app with ID ${credentials.appId}`)

  if (!credentials.subdomain) {
    throw new sdk.RuntimeError('Failed to delete app: no subdomain is associated with this bot installation')
  }

  const response = await fetch(`https://${credentials.subdomain}.zendesk.com/sc/oauth/authorization`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${credentials.token}`,
      'X-Zendesk-Marketplace-Name': bp.secrets.MARKETPLACE_BOT_NAME,
      'X-Zendesk-Marketplace-Organization-Id': bp.secrets.MARKETPLACE_ORG_ID,
    },
  })

  if (!response.ok) {
    console.log('error: ', response.json())
    logger.forBot().error('Failed to delete app', {
      status: response.status,
    })
    throw new sdk.RuntimeError('Failed to delete app')
  }
  logger.forBot().debug('Successfully deleted SunCo app')
}
