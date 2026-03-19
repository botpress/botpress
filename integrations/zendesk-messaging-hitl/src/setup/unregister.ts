import * as bp from '../../.botpress'
import { getSuncoClient } from '../client'
import { getStoredCredentials } from '../get-stored-credentials'
import { getBotpressIntegrationDisplayName } from './util'

export const unregister: bp.IntegrationProps['unregister'] = async (props) => {
  const { ctx, logger, client } = props
  try {
    const credentials = await getStoredCredentials(client, ctx)

    if (credentials.configType !== 'manual') {
      logger.forBot().info('OAuth mode: skipping switchboard cleanup on unregister')
      return
    }

    const suncoClient = getSuncoClient(credentials)
    const { id: switchboardId } = await suncoClient.getSwitchboardOrThrow()
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
