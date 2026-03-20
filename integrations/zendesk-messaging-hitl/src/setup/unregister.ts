import * as bp from '../../.botpress'
import { getSuncoClient } from '../client'
import { getStoredCredentials } from '../get-stored-credentials'

export const unregister: bp.IntegrationProps['unregister'] = async (props) => {
  const { ctx, logger, client, webhookUrl } = props
  try {
    const credentials = await getStoredCredentials(client, ctx)
    const suncoClient = getSuncoClient(credentials)

    const webhooks = await suncoClient.listWebhooks('me')
    const webhook = webhooks.find((wh) => wh.target === webhookUrl)
    if (webhook?.id) {
      await suncoClient.deleteWebhook('me', webhook.id)
      logger.forBot().info('Webhook removed successfully')
    } else {
      logger.forBot().info('No matching webhook found, nothing to remove')
    }

    logger.forBot().info('Zendesk Messaging HITL integration unregistered')
  } catch (thrown: unknown) {
    const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
    logger.forBot().error(`Failed to unregister integration, skipping: ${errMsg}`)
  }
}
