import { mapValues } from './record-utils'

type WithEnabled = { enabled?: boolean }

export const prepareIntegrationsUpdate = <T extends WithEnabled>(
  integrations: Record<string, T | null>,
  remoteIntegrations: Record<string, unknown>
): Record<string, T | null> =>
  mapValues(integrations, (integration, key) => {
    const isExistingInstance = key in remoteIntegrations
    if (integration !== null && !isExistingInstance && integration.enabled === undefined) {
      return { ...integration, enabled: false }
    }
    return integration
  })
