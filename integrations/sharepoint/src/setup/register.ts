import * as bp from '.botpress'
import { SharepointClient } from '../SharepointClient'
import { SharepointSync } from '../services/sync/SharepointSync'
import { cleanupWebhook, getLibraryNames } from './utils'

export const register: bp.IntegrationProps['register'] = async ({ ctx, webhookUrl, client, logger }) => {
  const libs = getLibraryNames(ctx.configuration.documentLibraryNames)

  const results = await Promise.allSettled(
    libs.map(async (lib) => {
      let webhookSubscriptionId: string | undefined
      try {
        const spClient = new SharepointClient({ ...ctx.configuration }, lib)
        logger.forBot().info(`[Registration] (${lib}) Creating webhook → ${webhookUrl}`)
        webhookSubscriptionId = await spClient.registerWebhook(webhookUrl)

        const spSync = new SharepointSync(spClient, client, logger, ctx.configuration.enableVision)
        logger.forBot().info(`[Registration] (${lib}) Performing initial full sync…`)
        await spSync.syncInitialDocuments(ctx.webhookId)

        const changeToken = await spClient.getLatestChangeToken()
        const tokenToUse = changeToken || 'initial-sync-token'

        logger.forBot().info(`[Registration] (${lib}) Successfully registered and synced.`)

        return { lib, webhookSubscriptionId, changeToken: tokenToUse }
      } catch (error) {
        if (webhookSubscriptionId) {
          await cleanupWebhook(webhookSubscriptionId, ctx, lib, logger)
        }
        logger
          .forBot()
          .error(
            `[Registration] (${lib}) Failed to register: ${error instanceof Error ? error.message : String(error)}. Skipping this library.`
          )
        throw error
      }
    })
  )

  const subscriptions: Record<string, { webhookSubscriptionId: string; changeToken: string }> = {}
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      const { lib, webhookSubscriptionId, changeToken } = result.value
      subscriptions[lib] = { webhookSubscriptionId, changeToken }
    }
  })

  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: { subscriptions, folderKbMap: ctx.configuration.folderKbMap },
  })
}
