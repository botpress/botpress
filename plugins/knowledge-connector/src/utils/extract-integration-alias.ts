import * as sdk from '@botpress/sdk'

export function extractIntegrationAlias(eventType: string, logger: sdk.BotLogger): string | null {
  const integrationAlias = eventType.split(':')[0]
  if (!integrationAlias) {
    logger.warn(`Could not extract integration alias from event type: ${eventType}`)
    return null
  }
  return integrationAlias
}
