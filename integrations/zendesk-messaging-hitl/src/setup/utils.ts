import { RuntimeError } from '@botpress/sdk'
import * as bp from '../../.botpress'
import { getSuncoClient } from '../client'

export function getBotpressIntegrationName(webhookId: string): string {
  return `botpress-hitl-${webhookId}`
}

export async function fetchAndCacheSwitchboardIntegrationsIdOrThrow(
  ctx: bp.Context,
  client: bp.Client,
  logger: bp.Logger
): Promise<{ switchboardIntegrationId: string; agentWorkspaceSwitchboardIntegrationId: string }> {
  logger.forBot().info('Fetching switchboard integration IDs from API...')
  const suncoClient = getSuncoClient(ctx.configuration, logger)
  const integrationName = getBotpressIntegrationName(ctx.webhookId)
  const switchboardId = await suncoClient.getSwitchboardIdOrThrow()

  // Find both switchboard integrations
  const switchboardIntegration = await suncoClient.findSwitchboardIntegrationByNameOrThrow(
    switchboardId,
    integrationName
  )
  const agentWorkspaceIntegration = await suncoClient.findAgentWorkspaceIntegrationOrThrow(switchboardId)

  // Cache both values
  await client.getOrSetState({
    type: 'integration',
    name: 'integrationIds' as any,
    id: ctx.integrationId,
    payload: {
      switchboardIntegrationId: switchboardIntegration.id,
      agentWorkspaceSwitchboardIntegrationId: agentWorkspaceIntegration.id,
    } as any,
  })

  logger
    .forBot()
    .info(
      `✅ Fetched and cached switchboard integration IDs - Switchboard Integration ID: ${switchboardIntegration.id}, Agent Workspace Switchboard Integration ID: ${agentWorkspaceIntegration.id}`
    )

  return {
    switchboardIntegrationId: switchboardIntegration.id,
    agentWorkspaceSwitchboardIntegrationId: agentWorkspaceIntegration.id,
  }
}

export async function getSwitchboardIntegrationId(
  ctx: bp.Context,
  client: bp.Client,
  logger: bp.Logger
): Promise<string> {
  // Try to get from cache first
  try {
    const switchboardIntegrationId = (
      await client.getState({
        type: 'integration',
        name: 'integrationIds' as any,
        id: ctx.integrationId,
      })
    ).state.payload

    if (!switchboardIntegrationId.length) {
      throw new RuntimeError('No switchboard integration ID found in cache')
    }

    return switchboardIntegrationId
  } catch {
    return (await fetchAndCacheSwitchboardIntegrationsIdOrThrow(ctx, client, logger)).switchboardIntegrationId
  }
}

export async function getAgentWorkspaceSwitchboardIntegrationId(
  ctx: bp.Context,
  client: bp.Client,
  logger: bp.Logger
): Promise<string> {
  // Try to get from cache first
  try {
    const { agentWorkspaceSwitchboardIntegrationId } = (
      await client.getState({
        type: 'integration',
        name: 'integrationIds' as any,
        id: ctx.integrationId,
      })
    ).state.payload

    if (!agentWorkspaceSwitchboardIntegrationId?.length) {
      throw new RuntimeError('No agent workspace switchboard integration ID found in cache')
    }

    return agentWorkspaceSwitchboardIntegrationId
  } catch {
    return (await fetchAndCacheSwitchboardIntegrationsIdOrThrow(ctx, client, logger))
      .agentWorkspaceSwitchboardIntegrationId
  }
}
