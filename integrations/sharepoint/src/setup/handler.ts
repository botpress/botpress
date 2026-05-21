import type { ChangeItem } from '../misc/SharepointTypes'
import { SharepointClient } from '../SharepointClient'
import * as bp from '.botpress'

type ItemCache = Record<string, { absolutePath: string; name: string }>
type AggregatePayload = bp.events.Events['aggregateFileChanges']
type Created = AggregatePayload['modifiedItems']['created']
type Updated = AggregatePayload['modifiedItems']['updated']
type Deleted = AggregatePayload['modifiedItems']['deleted']

function applyChange(
  ch: ChangeItem,
  cache: ItemCache,
  pathMap: Map<number, string | null | undefined>,
  created: Created,
  updated: Updated,
  deleted: Deleted,
  logger: bp.Logger,
  lib: string
) {
  const itemId = ch.ItemId.toString()
  switch (ch.ChangeType) {
    case 1:
    case 6:
    case 7: {
      const spPath = pathMap.get(ch.ItemId)
      if (!spPath) break
      const name = spPath.split('/').pop() ?? spPath
      cache[itemId] = { absolutePath: spPath, name }
      created.push({ type: 'file', id: itemId, name, absolutePath: spPath })
      break
    }
    case 2:
    case 4: {
      const spPath = pathMap.get(ch.ItemId)
      if (!spPath) break
      const name = spPath.split('/').pop() ?? spPath
      cache[itemId] = { absolutePath: spPath, name }
      updated.push({ type: 'file', id: itemId, name, absolutePath: spPath })
      break
    }
    case 3:
    case 5: {
      const cached = cache[itemId]
      if (!cached) {
        logger.forBot().warn(`[Handler] (${lib}) Delete for unknown item ${itemId} — skipping`)
        break
      }
      delete cache[itemId]
      deleted.push({ type: 'file', id: itemId, name: cached.name, absolutePath: cached.absolutePath })
      break
    }
    default:
      logger.forBot().debug(`[Handler] (${lib}) Skipping unsupported ChangeType=${ch.ChangeType}`)
  }
}

const RENEW_THRESHOLD_MS = 5 * 24 * 60 * 60 * 1000
const SUBSCRIPTION_DURATION_MS = 30 * 24 * 60 * 60 * 1000

export const handler: bp.IntegrationProps['handler'] = async ({ ctx, req, client, logger }) => {
  const queryParams = new URLSearchParams(req.query)
  if (queryParams.has('validationtoken')) {
    return { status: 200, body: queryParams.get('validationtoken') ?? '' }
  }

  let body: unknown
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    logger.forBot().error('[Handler] Failed to parse webhook body')
    return { status: 400, body: 'Bad Request' }
  }

  const parsed = body as { value?: Array<{ clientState?: string }> }
  if (Array.isArray(parsed?.value)) {
    const notifClientState = parsed.value[0]?.clientState
    if (notifClientState !== ctx.webhookId) {
      logger.forBot().error(`[Handler] Rejected notification with unexpected clientState: ${notifClientState}`)
      return { status: 200, body: 'OK' }
    }
  }

  let statePayload: { subscriptions: Record<string, unknown> }
  try {
    const { state } = await client.getState({ type: 'integration', name: 'configuration', id: ctx.integrationId })
    statePayload = state.payload as typeof statePayload
  } catch {
    logger.forBot().info('[Handler] No state found — nothing to process')
    return { status: 200, body: 'OK' }
  }

  const subs = statePayload.subscriptions as Record<
    string,
    { webhookSubscriptionId: string; changeToken: string; itemPathCache: ItemCache; expiresAt?: string }
  >
  const updatedSubs = { ...subs }

  for (const [lib, sub] of Object.entries(subs)) {
    try {
      const spClient = new SharepointClient(ctx.configuration, lib)

      // Renew if expiresAt is missing or within 5 days
      let currentSub = { ...sub }
      const msUntilExpiry = currentSub.expiresAt ? new Date(currentSub.expiresAt).getTime() - Date.now() : 0
      if (!currentSub.expiresAt || msUntilExpiry < RENEW_THRESHOLD_MS) {
        const newExpiry = new Date(Date.now() + SUBSCRIPTION_DURATION_MS).toISOString()
        await spClient.renewWebhook(currentSub.webhookSubscriptionId, newExpiry)
        currentSub = { ...currentSub, expiresAt: newExpiry }
        logger.forBot().info(`[Handler] (${lib}) Renewed webhook subscription until ${newExpiry}`)
      }
      updatedSubs[lib] = currentSub

      const changes = await spClient.getChanges(currentSub.changeToken)
      if (changes.length === 0) continue

      const newToken = changes.at(-1)!.ChangeToken.StringValue
      const cache: ItemCache = { ...(currentSub.itemPathCache ?? {}) }

      const created: Created = []
      const updated: Updated = []
      const deleted: Deleted = []

      // Pre-fetch paths in parallel for all items that need a lookup (add/update/rename/restore/move-in)
      const needsLookup = changes.filter((ch) => [1, 2, 4, 6, 7].includes(ch.ChangeType))
      const pathResults = await Promise.all(needsLookup.map((ch) => spClient.getFilePath(ch.ItemId)))
      const pathMap = new Map(needsLookup.map((ch, i) => [ch.ItemId, pathResults[i]]))

      for (const ch of changes) {
        applyChange(ch, cache, pathMap, created, updated, deleted, logger, lib)
      }

      if (created.length > 0 || updated.length > 0 || deleted.length > 0) {
        await client.createEvent({
          type: 'aggregateFileChanges',
          payload: { modifiedItems: { created, updated, deleted } },
        })
        logger
          .forBot()
          .info(
            `[Handler] (${lib}) Emitted aggregateFileChanges: +${created.length} ~${updated.length} -${deleted.length}`
          )
      }

      updatedSubs[lib] = { ...currentSub, changeToken: newToken, itemPathCache: cache }
    } catch (error) {
      logger.forBot().error(`[Handler] (${lib}) Failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: { subscriptions: updatedSubs as bp.states.States['configuration']['payload']['subscriptions'] },
  })

  return { status: 200, body: 'OK' }
}
