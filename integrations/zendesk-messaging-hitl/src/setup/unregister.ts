import * as bp from '../../.botpress'
import { getSuncoClient } from '../client'
import { getStoredCredentials } from '../get-stored-credentials'
import { getBotpressIntegrationDisplayName } from './util'

export const unregister: bp.IntegrationProps['unregister'] = async (props) => {
  const { ctx, logger, client, webhookUrl } = props
  try {
    const credentials = await getStoredCredentials(client, ctx)
    const suncoClient = getSuncoClient(credentials)

    if (credentials.configType === 'manual') {
      // Delete Switchboard Integration and Integration
      const integrationDisplayName = getBotpressIntegrationDisplayName(ctx.webhookId)
      const integrationId = (await suncoClient.findIntegrationByDisplayNameOrThrow(integrationDisplayName)).id

      const { id: switchboardId } = await suncoClient.getSwitchboardOrThrow()
      const { id: switchboardIntegrationId } = await suncoClient.findSwitchboardIntegrationByNameOrThrow(
        switchboardId,
        integrationDisplayName
      )
      await suncoClient.deleteSwitchboardIntegration(switchboardId, switchboardIntegrationId)
      await suncoClient.deleteIntegration(integrationId)
    } else {
      const integrationId = 'me'

      // Delete matching webhook
      const webhooks = await suncoClient.listWebhooks(integrationId)
      const webhook = webhooks.find((wh) => wh.target === webhookUrl)
      if (webhook?.id) {
        await suncoClient.deleteWebhook(integrationId, webhook.id)
        logger.forBot().info('Webhook removed successfully')
      } else {
        logger.forBot().info('No matching webhook found, nothing to remove')
      }
    }

    logger.forBot().info('Zendesk Messaging HITL integration unregistered')
  } catch (thrown: unknown) {
    const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
    logger.forBot().error(`Failed to unregister integration, skipping: ${errMsg}`)
  }
}
