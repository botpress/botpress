import { SharepointClient } from '../SharepointClient'
import { cleanupWebhook } from './utils'
import * as bp from '.botpress'

type Subscriptions = Record<
  string,
  {
    webhookSubscriptionId: string
    changeToken: string
    itemPathCache: Record<string, { absolutePath: string; name: string }>
    expiresAt: string
  }
>

export const register: bp.IntegrationProps['register'] = async ({ ctx, webhookUrl, client, logger }) => {
  // Read existing subscriptions so dynamically added libraries (via addToSync) are preserved across re-registrations
  let existingSubscriptions: Subscriptions = {}
  try {
    const { state } = await client.getState({ type: 'integration', name: 'configuration', id: ctx.integrationId })
    existingSubscriptions = state.payload.subscriptions as Subscriptions
  } catch {
    // State doesn't exist yet — start fresh
  }

  const libs = ctx.configuration.documentLibraryNames ?? []
  if (libs.length === 0) {
    logger.forBot().info('[Registration] No documentLibraryNames configured — skipping webhook setup')
    await client.setState({
      type: 'integration',
      name: 'configuration',
      id: ctx.integrationId,
      payload: { subscriptions: existingSubscriptions },
    })
    return
  }

  const results = await Promise.allSettled(
    libs.map(async (lib) => {
      let webhookSubscriptionId: string | undefined
      try {
        const spClient = new SharepointClient(ctx.configuration, lib)

        // Delete any stale subscriptions pointing to this webhook URL before creating a fresh one
        const existing = await spClient.listWebhookSubscriptions()
        const stale = existing.filter((s) => s.notificationUrl === webhookUrl)
        if (stale.length > 0) {
          logger.forBot().info(`[Registration] (${lib}) Removing ${stale.length} stale subscription(s)`)
          await Promise.allSettled(stale.map((s) => spClient.unregisterWebhook(s.id)))
        }

        logger.forBot().info(`[Registration] (${lib}) Creating webhook → ${webhookUrl}`)
        webhookSubscriptionId = await spClient.registerWebhook(webhookUrl, ctx.webhookId)
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

        const changeToken = await spClient.getLatestChangeToken()
        logger.forBot().info(`[Registration] (${lib}) Registered successfully`)
        return { lib, webhookSubscriptionId, changeToken: changeToken ?? 'initial-sync-token', expiresAt }
      } catch (error) {
        if (webhookSubscriptionId) {
          await cleanupWebhook(webhookSubscriptionId, ctx, lib, logger)
        }
        logger
          .forBot()
          .error(`[Registration] (${lib}) Failed: ${error instanceof Error ? error.message : String(error)}`)
        throw error
      }
    })
  )

  // Merge: preserve existing addToSync subscriptions, overwrite config-declared ones with fresh registrations
  const subscriptions: Subscriptions = { ...existingSubscriptions }
  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { lib, webhookSubscriptionId, changeToken, expiresAt } = result.value
      subscriptions[lib] = { webhookSubscriptionId, changeToken, itemPathCache: {}, expiresAt }
    }
  }

  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: { subscriptions },
  })

  logger.forBot().info(`[Registration] Done. Subscribed: ${Object.keys(subscriptions).join(', ')}`)
}
