import * as sdk from '@botpress/sdk'
import { StoredCredentials } from 'src/types'
import * as bp from '.botpress'

const { z } = sdk

const createWebhookSchema = z
  .object({
    webhook: z.object({
      secret: z.string(),
    }),
  })
  .passthrough()

export const createWebhook = async ({
  credentials,
  logger,
  webhookUrl,
}: {
  credentials: StoredCredentials
  logger: bp.Logger
  webhookUrl: string
}): Promise<{
  webhookSecret: string
}> => {
  logger.forBot().debug('Creating webhook')

  if (!credentials.subdomain) {
    throw new sdk.RuntimeError('failed to register webhook: no subdomain is associated with this bot installation')
  }

  const params = {
    target: webhookUrl,
    triggers: ['conversation:message', 'conversation:postback'],
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

  return { webhookSecret: webhook.webhook.secret }
}
