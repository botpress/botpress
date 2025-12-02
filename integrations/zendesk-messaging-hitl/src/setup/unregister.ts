import * as bp from '../../.botpress'
import { getSuncoClient } from '../client'
import { getBotpressIntegrationDisplayName } from './utils'

export const unregister: bp.IntegrationProps['unregister'] = async ({ ctx, logger }) => {
  try {
    const suncoClient = getSuncoClient(ctx.configuration, logger)

    const switchboardId = await suncoClient.getSwitchboardIdOrThrow()

    const integrationDisplayName = getBotpressIntegrationDisplayName(ctx.webhookId)

    const { id: switchboardIntegrationId } = await suncoClient.findSwitchboardIntegrationByNameOrThrow(
      switchboardId,
      integrationDisplayName
    )

    await suncoClient.deleteSwitchboardIntegration(switchboardId, switchboardIntegrationId)

    const { id: integrationId } = await suncoClient.findIntegrationByDisplayNameOrThrow(integrationDisplayName)

    await suncoClient.deleteIntegration(integrationId)

    logger.forBot().info('Zendesk Messaging HITL integration unregistered')
  } catch (thrown: unknown) {
    const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
    logger.forBot().error(`Failed to unregister integration, skipping: ${errMsg}`)
  }
}
