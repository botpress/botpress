import * as bp from '.botpress'
import { partition } from 'lodash'
import { mergeKBMapping } from 'src/misc/utils'
import { SharepointSync } from 'src/services/sync/SharepointSync'
import { cleanupWebhook, getLibraryNames } from 'src/setup/utils'
import { SharepointClient } from 'src/SharepointClient'

export const addToSync: bp.Integration['actions']['addToSync'] = async ({ client, ctx, input, logger }) => {
  // setup
  const webhookUrl = `https://webhook.botpress.cloud/${ctx.webhookId}`

  // prev state
  const { state } = await client.getState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
  })

  const subscriptions: Record<string, { webhookSubscriptionId: string; changeToken: string }> =
    state.payload.subscriptions
  const libs = getLibraryNames(input.documentLibraryNames)

  // filter to not repeat existing webhooks
  const [nonExistingLibs, existingLibs] = partition(libs, (lib) => !Object.hasOwn(subscriptions, lib))

  logger.forBot().info(`[Action] - Attempting to create webhooks for the following libs: ${libs}`)
  if (existingLibs.length > 0)
    logger.forBot().info(`[Action] - Skipping the following libs since they already exist: ${existingLibs}`)

  // create webhooks for each of the new document libraries
  const results = await Promise.allSettled(
    nonExistingLibs.map(async (newLib) => {
      let webhookSubscriptionId: string | undefined
      try {
        const spClient = new SharepointClient({ ...ctx.configuration, folderKbMap: input.folderKbMap }, newLib)
        logger.forBot().info(`[Action] (${newLib}) Creating webhook → ${webhookUrl}`)
        webhookSubscriptionId = await spClient.registerWebhook(webhookUrl)

        const spSync = new SharepointSync(spClient, client, logger, ctx.configuration.enableVision)
        logger.forBot().info(`[Action] (${newLib}) Performing initial full sync…`)
        await spSync.syncDocumentsWithoutCleaning(ctx.webhookId)

        const changeToken = await spClient.getLatestChangeToken()
        const tokenToUse = changeToken || 'initial-sync-token'

        logger.forBot().info(`[Action] (${newLib}) Successfully registered and synced.`)

        return { lib: newLib, webhookSubscriptionId, changeToken: tokenToUse }
      } catch (error) {
        if (webhookSubscriptionId) {
          await cleanupWebhook(webhookSubscriptionId, ctx, newLib, logger, input.folderKbMap)
        }
        logger
          .forBot()
          .error(
            `[Action] (${newLib}) Failed to register: ${error instanceof Error ? error.message : String(error)}. Skipping this library.`
          )
        throw error
      }
    })
  )

  const newSubscriptions: Record<string, { webhookSubscriptionId: string; changeToken: string }> = {}
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      const { lib, webhookSubscriptionId, changeToken } = result.value
      newSubscriptions[lib] = { webhookSubscriptionId, changeToken }
    }
  })

  // combine and set all subscriptions to state for cleanup
  const mergedSubscriptions = {
    ...subscriptions,
    ...newSubscriptions,
  }

  const mergedKBmap = mergeKBMapping(state.payload.folderKbMap, input.folderKbMap)

  const nextPayload = { ...state.payload, subscriptions: mergedSubscriptions, folderKbMap: mergedKBmap }

  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: nextPayload,
  })

  return {
    success: true,
  }
}
