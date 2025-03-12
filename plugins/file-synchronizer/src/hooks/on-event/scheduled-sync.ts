import * as bp from '.botpress'
import { SYNC_IMMEDIATE_DELAY_MS, SYNC_REQUEUE_DELAY_MS } from '../../consts'

export const handleEvent: bp.EventHandlers['scheduledSync'] = async ({
  ctx,
  client,
  configuration,
  event,
  interfaces,
  logger,
  actions,
}) => {
  const { itemToSync, syncId, syncInitiatedAt, syncType, syncRecursively, nextToken: previousToken } = event.payload

  if (syncType === 'real-time' && !configuration.enableRealTimeSync) {
    logger.info('Real-time sync is disabled. Ignoring sync event...', event.payload)
    return
  } else if (syncType === 'periodic' && !configuration.enablePeriodicSync) {
    logger.info('Periodic sync is disabled. Ignoring sync event...', event.payload)
    return
  }

  const syncState = await getSyncState({ client, ctx })

  if (syncState?.lock && syncState.lock.syncId !== syncId) {
    logger.info('Another sync operation is already in progress. Requeuing...', syncState.lock)

    await client.createEvent({
      type: 'scheduledSync',
      payload: event.payload,
      schedule: { delay: SYNC_REQUEUE_DELAY_MS },
    })
    return
  }

  if (itemToSync?.type === 'file') {
    const existingFile = await client.listFiles({
      tags: {
        externalId: itemToSync.id,
        externalModifiedDate: itemToSync.lastModifiedDate,
        externalSize: itemToSync.sizeInBytes.toString(),
      },
    })

    if (existingFile.files.length > 0) {
      logger.info('An identical file already exists in Botpress. Ignoring...', { file: existingFile.files[0] })
      return
    }

    const { botpressFileId } = await actions['files-readonly'].transferFileToBotpress({ fileId: itemToSync.id })

    await client.updateFileMetadata({
      id: botpressFileId,
      metadata: {
        syncId,
        syncInitiatedAt,
        syncType,
        integrationName: interfaces['files-readonly'].name,
      },
      tags: {
        externalId: itemToSync.id,
        externalModifiedDate: itemToSync.lastModifiedDate ?? null,
        externalSize: itemToSync.sizeInBytes.toString(),
      },
    })
  } else if (itemToSync?.type === 'folder') {
    const {
      items,
      meta: { nextToken },
    } = await actions['files-readonly'].listItemsInFolder({ folderId: itemToSync.id, nextToken: previousToken })

    if (nextToken) {
      // Requeue same event with new nextToken:
      await client.createEvent({
        type: 'scheduledSync',
        payload: {
          ...event.payload,
          nextToken,
        },
        schedule: { delay: SYNC_IMMEDIATE_DELAY_MS },
      })
    }

    for (const item of items) {
      if (item.type === 'folder' && !syncRecursively) {
        continue
      }

      await client.createEvent({
        type: 'scheduledSync',
        payload: {
          syncId,
          syncType,
          syncInitiatedAt,
          itemToSync: item,
          syncRecursively,
        },
        schedule: { delay: SYNC_IMMEDIATE_DELAY_MS },
      })
    }
  } else {
    // sync all files and folders:
    const {
      items,
      meta: { nextToken },
    } = await actions['files-readonly'].listItemsInFolder({})

    if (nextToken) {
      // Requeue same event with new nextToken:
      await client.createEvent({
        type: 'scheduledSync',
        payload: {
          ...event.payload,
          nextToken,
        },
        schedule: { delay: SYNC_IMMEDIATE_DELAY_MS },
      })
    }

    for (const item of items) {
      if (item.type === 'folder' && !syncRecursively) {
        continue
      }

      await client.createEvent({
        type: 'scheduledSync',
        payload: {
          syncId,
          syncType,
          syncInitiatedAt,
          itemToSync: item,
          syncRecursively,
        },
        schedule: { delay: SYNC_IMMEDIATE_DELAY_MS },
      })
    }
  }

  // TODO: find a better way to remove locks:
  const { events: pendingEvents } = await client.listEvents({ type: 'scheduledSync', status: 'scheduled' })

  for (const event of pendingEvents) {
    if (event.payload.syncId === syncId) {
      return
    }
  }

  await client.setState({ id: ctx.botId, type: 'bot', name: 'fileSync', payload: { lock: null } })
}

const getSyncState = async ({
  client,
  ctx,
}: {
  client: bp.Client
  ctx: bp.EventHandlerProps['ctx']
}): Promise<bp.states.States['fileSync'] | undefined> => {
  try {
    const { state } = await client.getState({ id: ctx.botId, type: 'bot', name: 'fileSync' })
    return state.payload
  } catch {}
  return
}
