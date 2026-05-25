import * as sdk from '@botpress/sdk'
import { cleanupWebhook } from '../setup/utils'
import { SharepointClient } from '../SharepointClient'
import * as bp from '.botpress'

export const addToSync: bp.Integration['actions']['addToSync'] = async ({ client, ctx, input, logger }) => {
  const webhookUrl = `https://webhook.botpress.cloud/${ctx.webhookId}`

  let rawState: { payload: { subscriptions: unknown } } | undefined
  try {
    const { state } = await client.getState({ type: 'integration', name: 'configuration', id: ctx.integrationId })
    rawState = state as typeof rawState
  } catch {
    // State not yet initialized — treat as empty
  }

  const subscriptions = (rawState?.payload?.subscriptions ?? {}) as Record<
    string,
    {
      webhookSubscriptionId: string
      changeToken: string
      itemPathCache: Record<string, { absolutePath: string; name: string }>
      expiresAt?: string
    }
  >
  const libs = input.documentLibraryNames
  const newLibs = libs.filter((lib) => !(lib in subscriptions))

  if (newLibs.length === 0) {
    logger.forBot().info('[addToSync] All requested libraries are already subscribed')
    return {}
  }

  const results = await Promise.allSettled(
    newLibs.map(async (lib) => {
      let webhookSubscriptionId: string | undefined
      try {
        const spClient = new SharepointClient(ctx.configuration, lib)
        logger.forBot().info(`[addToSync] (${lib}) Creating webhook → ${webhookUrl}`)
        webhookSubscriptionId = await spClient.registerWebhook(webhookUrl, ctx.webhookId)
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

        const changeToken = await spClient.getLatestChangeToken()
        logger.forBot().info(`[addToSync] (${lib}) Done`)
        return { lib, webhookSubscriptionId, changeToken: changeToken ?? 'initial-sync-token', expiresAt }
      } catch (error) {
        if (webhookSubscriptionId) {
          await cleanupWebhook(webhookSubscriptionId, ctx, lib, logger)
        }
        logger.forBot().error(`[addToSync] (${lib}) Failed: ${error instanceof Error ? error.message : String(error)}`)
        throw error
      }
    })
  )

  const newSubscriptions: typeof subscriptions = {}
  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { lib, webhookSubscriptionId, changeToken, expiresAt } = result.value
      newSubscriptions[lib] = { webhookSubscriptionId, changeToken, itemPathCache: {}, expiresAt }
    }
  }

  if (Object.keys(newSubscriptions).length === 0) {
    throw new sdk.RuntimeError('[addToSync] All libraries failed to register. Check logs for details.')
  }

  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: { subscriptions: { ...subscriptions, ...newSubscriptions } },
  })

  return {}
}
