import * as bp from '.botpress'

const SYNC_LOCK_TIMEOUT = 5 * 60 * 1000 // 5 minutes

export async function checkAndAcquireSyncLock({
  client,
  integrationId,
  runId,
  offset,
  logger,
}: {
  client: bp.Client
  integrationId: string
  runId: string
  offset: number
  logger: bp.Logger
}): Promise<boolean> {
  // check for duplicate webhooks
  let syncLock
  try {
    syncLock = await client.getState({
      type: 'integration',
      id: integrationId,
      name: 'activeSyncLock',
    })
  } catch (error) {
    syncLock = null
  }

  const lockPayload = syncLock?.state?.payload as { runId: string; timestamp: number; offset: number } | undefined
  const now = Date.now()

  // if another sync is active for this run within the last 5 minutes, skip this duplicate
  if (lockPayload?.runId === runId && now - lockPayload.timestamp < SYNC_LOCK_TIMEOUT) {
    logger
      .forBot()
      .info(`⏭️ Sync already in progress for ${runId} at offset ${lockPayload.offset}, skipping duplicate webhook`)
    return false
  }

  // acquire lock before processing to prevent parallel execution
  try {
    await client.setState({
      type: 'integration',
      id: integrationId,
      name: 'activeSyncLock',
      payload: {
        runId,
        timestamp: Date.now(),
        offset,
      },
    })
  } catch (error) {
    logger.forBot().warn(`Failed to set sync lock: ${error}`)
  }

  return true
}

export async function updateSyncLock({
  client,
  integrationId,
  runId,
  offset,
  logger,
}: {
  client: bp.Client
  integrationId: string
  runId: string
  offset: number
  logger: bp.Logger
}): Promise<void> {
  try {
    await client.setState({
      type: 'integration',
      id: integrationId,
      name: 'activeSyncLock',
      payload: {
        runId,
        timestamp: Date.now(),
        offset,
      },
    })
  } catch (error) {
    logger.forBot().warn(`Failed to update sync lock: ${error}`)
  }
}

export async function releaseSyncLock({
  client,
  integrationId,
  logger,
}: {
  client: bp.Client
  integrationId: string
  logger: bp.Logger
}): Promise<void> {
  try {
    await client.setState({
      type: 'integration',
      id: integrationId,
      name: 'activeSyncLock',
      payload: null,
    })
  } catch (error) {
    logger.forBot().warn(`Failed to clear sync lock: ${error}`)
  }
}
