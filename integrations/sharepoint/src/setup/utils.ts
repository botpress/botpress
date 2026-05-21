import { SharepointClient } from '../SharepointClient'
import * as bp from '.botpress'

export const getLibraryNames = (documentLibraryNames: string): string[] => {
  try {
    const parsed = JSON.parse(documentLibraryNames)
    if (Array.isArray(parsed)) {
      return parsed
    }
    return [parsed]
  } catch {
    return documentLibraryNames
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
}

export const cleanupWebhook = async (
  webhookSubscriptionId: string,
  ctx: bp.Context,
  lib: string,
  logger: bp.Logger
): Promise<void> => {
  try {
    const spClient = new SharepointClient(ctx.configuration, lib)
    await spClient.unregisterWebhook(webhookSubscriptionId)
    logger.forBot().info(`[Setup] (${lib}) Cleaned up orphaned webhook`)
  } catch (cleanupError) {
    logger
      .forBot()
      .error(
        `[Setup] (${lib}) Failed to clean up webhook: ${
          cleanupError instanceof Error ? cleanupError.message : String(cleanupError)
        }`
      )
  }
}
