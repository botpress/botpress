import { SharepointClient } from 'src/SharepointClient'
import * as bp from '.botpress/'

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
      .map((s: string) => s.trim())
      .filter(Boolean)
  }
}

export const cleanupWebhook = async (
  webhookSubscriptionId: string,
  ctx: bp.Context,
  newLib: string,
  logger: bp.Logger,
  folderKbMap?: string
) => {
  // clean up webhook
  try {
    const spClient = new SharepointClient({ ...ctx.configuration, ...(folderKbMap ? { folderKbMap } : {}) }, newLib)
    await spClient.unregisterWebhook(webhookSubscriptionId)
    logger.forBot().info(`[Action] (${newLib}) Cleaned up orphaned webhook`)
  } catch (cleanupError) {
    logger
      .forBot()
      .error(
        `[Action] (${newLib}) Failed to clean up webhook: ${
          cleanupError instanceof Error ? cleanupError.message : String(cleanupError)
        }`
      )
  }
}
