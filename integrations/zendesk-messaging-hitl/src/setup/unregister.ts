import * as bp from '../../.botpress'
import { getSuncoClient } from '../client'
import { getBotpressIntegrationName } from './utils'

export const unregister: bp.IntegrationProps['unregister'] = async ({ ctx, logger }) => {
  try {
    const suncoClient = getSuncoClient(ctx.configuration, logger)

    const switchboardId = await suncoClient.getSwitchboardId()

    const integrationName = getBotpressIntegrationName(ctx.webhookId)

    const { id: integrationId } = await suncoClient.findIntegrationByNameOrThrow(integrationName)

    const { id: switchboardIntegrationId } = await suncoClient.findSwitchboardIntegrationByNameOrThrow(
      switchboardId,
      integrationName
    )

    await suncoClient.deleteSwitchboardIntegration(switchboardId, switchboardIntegrationId)

    await suncoClient.deleteIntegration(integrationId)

    logger.forBot().info('Zendesk Messaging HITL integration unregistered')
  } catch (error: any) {
    logger.forBot().error('Failed to unregister integration, skipping: ' + error.message, error)
  }
}
