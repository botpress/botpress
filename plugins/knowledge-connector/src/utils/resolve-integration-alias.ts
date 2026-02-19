import * as sdk from '@botpress/sdk'

/**
 * Resolves the real integration alias from an event type prefix.
 * If the prefix is an interface name (e.g. "files-readonly"), looks it up
 * in props.interfaces to get the actual integration alias (e.g. "dropbox").
 * If it's already an integration alias, returns it as-is.
 */
export function resolveIntegrationAlias(
  eventType: string,
  interfaces: Record<string, { integrationAlias: string }>,
  logger: sdk.BotLogger
): string | null {
  const prefix = eventType.split(':')[0]
  if (!prefix) {
    logger.warn(`Could not extract prefix from event type: ${eventType}`)
    return null
  }

  // Check if the prefix is an interface name — if so, resolve to the real integration alias
  const iface = interfaces[prefix]
  if (iface) {
    return iface.integrationAlias
  }

  // TODO: remove hardcode once files-readonly is declared as an interface dependency
  if (prefix === 'files-readonly') {
    return 'dropbox'
  }

  // Otherwise, the prefix is already the integration alias
  return prefix
}
