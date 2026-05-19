import * as bp from '.botpress'
import { SharepointClient } from '../SharepointClient'
import { SharepointSync } from '../services/sync/SharepointSync'

export const handler: bp.IntegrationProps['handler'] = async ({ ctx, req, client, logger }) => {
  /* 0 - Validation ping from SharePoint */
  if (req.query.includes('validationtoken')) {
    const token = req.query.split('=')[1]
    return { status: 200, body: token }
  }

  /* 1 - Load per‑library state */
  const {
    state: { payload },
  } = await client.getState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
  })

  const oldSubs = payload.subscriptions as Record<string, { webhookSubscriptionId: string; changeToken: string }>
  const newSubs = { ...oldSubs }

  // Handle background processing
  try {
    const webhookData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    if (webhookData?.event === 'background-sync-triggered') {
      logger.forBot().info('Processing internal background sync webhook')

      await executeBackgroundSync(ctx, client, logger, payload, webhookData)

      // Return early - background sync doesn't need incremental sync loop
      return { status: 200, body: 'Background sync processing' }
    }
  } catch (error) {
    logger.forBot().error(`[Webhook Handler] Failed to parse req JSON body ${JSON.stringify(req.body)} ${error}`)
  }

  /* 2 - Iterate through each library, perform incremental sync */
  for (const [lib, { changeToken }] of Object.entries(oldSubs)) {
    try {
      const spClient = new SharepointClient({ ...ctx.configuration, folderKbMap: payload.folderKbMap }, lib)
      const spSync = new SharepointSync(spClient, client, logger, ctx.configuration.enableVision)

      logger.forBot().info(`[Webhook] (${lib}) Running incremental sync…`)
      const newToken = await spSync.syncSharepointDocumentLibraryAndBotpressKB(changeToken)
      newSubs[lib]!.changeToken = newToken // non‑null assertion OK – lib is guaranteed
      logger.forBot().info(`[Webhook] (${lib}) Successfully synced.`)
    } catch (error) {
      logger
        .forBot()
        .error(
          `[Webhook] (${lib}) Failed to sync: ${error instanceof Error ? error.message : String(error)}. Skipping this library.`
        )
      continue
    }
  }

  /* 3 - Persist updated change tokens */
  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: { subscriptions: newSubs, folderKbMap: payload.folderKbMap },
  })

  return { status: 200, body: 'OK' }
}

const executeBackgroundSync = async (
  ctx: bp.Context,
  client: bp.Client,
  logger: bp.Logger,
  payload: { folderKbMap: string },
  webhookData: {
    event: 'background-sync-triggered'
    data: {
      nextUrl: string
      lib: string
    }
  }
) => {
  try {
    const { nextUrl, lib } = webhookData.data
    const spClient = new SharepointClient({ ...ctx.configuration, folderKbMap: payload.folderKbMap }, lib)
    const spSync = new SharepointSync(spClient, client, logger, ctx.configuration.enableVision)

    const result = await spSync.syncRemainingDocuments(nextUrl)
    logger.forBot().info(`[Background Sync] (${lib}) Complete: ${result.filesProcessed} files processed`)
  } catch (error) {
    logger.forBot().error(`[Background Sync] Failed to finish background processing ${error}`)
  }
}
