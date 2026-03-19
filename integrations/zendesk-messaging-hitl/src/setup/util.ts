import * as bp from '../../.botpress'
import { StoredCredentials } from '../types'

export function getBotpressIntegrationDisplayName(webhookId: string): string {
  return `botpress-hitl-${webhookId}`
}

export function getSwitchboardIntegrationName(credentials: StoredCredentials, ctx: { webhookId: string }): string {
  if (credentials.configType !== 'manual') {
    return bp.secrets.CLIENT_ID
  }
  return getBotpressIntegrationDisplayName(ctx.webhookId)
}

export function getAgentWorkspaceSwitchboardIntegrationName(): string {
  return 'zd-agentWorkspace'
}
