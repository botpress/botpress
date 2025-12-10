import { RuntimeError } from '@botpress/sdk'
import { getSuncoClient } from '../client'
import { Client, IntegrationCtx, Logger } from '../types'

export function getBotpressIntegrationDisplayName(webhookId: string): string {
  return `botpress-hitl-${webhookId}`
}

export async function fetchAndCacheSwitchboardIntegrationsIdOrThrow(
  ctx: IntegrationCtx,
  client: Client,
  logger: Logger
): Promise<{ switchboardIntegrationId: string; agentWorkspaceSwitchboardIntegrationId: string }> {
  logger.forBot().info('Fetching switchboard integration IDs from API...')
  const suncoClient = getSuncoClient(ctx.configuration)
  const integrationDisplayName = getBotpressIntegrationDisplayName(ctx.webhookId)
  const { id: switchboardId } = await suncoClient.getSwitchboardOrThrow()

  // Find both switchboard integrations
  const switchboardIntegration = await suncoClient.findSwitchboardIntegrationByNameOrThrow(
    switchboardId,
    integrationDisplayName
  )
  const agentWorkspaceIntegration = await suncoClient.findAgentWorkspaceIntegrationOrThrow(switchboardId)

  // Cache both values
  await client.getOrSetState({
    type: 'integration',
    name: 'switchboardIntegrationIds',
    id: ctx.integrationId,
    payload: {
      switchboardIntegrationId: switchboardIntegration.id,
      agentWorkspaceSwitchboardIntegrationId: agentWorkspaceIntegration.id,
    },
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
  ctx: IntegrationCtx,
  client: Client,
  logger: Logger
): Promise<string> {
  // Try to get from cache first
  try {
    const { switchboardIntegrationId } = (
      await client.getState({
        type: 'integration',
        name: 'switchboardIntegrationIds',
        id: ctx.integrationId,
      })
    ).state.payload

    if (!switchboardIntegrationId?.length) {
      throw new RuntimeError('No switchboard integration ID found in cache')
    }

    return switchboardIntegrationId
  } catch {
    return (await fetchAndCacheSwitchboardIntegrationsIdOrThrow(ctx, client, logger)).switchboardIntegrationId
  }
}

export async function getAgentWorkspaceSwitchboardIntegrationId(
  ctx: IntegrationCtx,
  client: Client,
  logger: Logger
): Promise<string> {
  // Try to get from cache first
  try {
    const { agentWorkspaceSwitchboardIntegrationId } = (
      await client.getState({
        type: 'integration',
        name: 'switchboardIntegrationIds',
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
