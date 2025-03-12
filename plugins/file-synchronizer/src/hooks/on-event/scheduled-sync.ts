import * as picomatch from 'picomatch'
import { MediaTypes } from 'src/iana-media-types'
import { SYNC_IMMEDIATE_DELAY_MS, SYNC_REQUEUE_DELAY_MS } from '../../consts'
import type * as types from '../../types'
import * as bp from '.botpress'

export const handleEvent: bp.EventHandlers['scheduledSync'] = async (props) => {
  const itemToSync = props.event.payload.itemToSync

  if (_isSyncTypeDisabled(props)) {
    return
  }

  if (await _isAnotherSyncOperationInProgress(props)) {
    await _requeueSameEventWithDelay(props)
    return
  }

  try {
    if (_isFileItem(itemToSync)) {
      if (_isFileIgnored(props, itemToSync) || (await _isIdenticalFileAlreadyUploaded(props, itemToSync))) {
        return
      }

      await _transferFileToBotpress(props, itemToSync)
    } else if (_isFolderItem(itemToSync)) {
      if (_isFolderIgnored(props, itemToSync)) {
        return
      }

      await _transferFolderToBotpress(props, itemToSync)
    } else {
      await _transferAllFilesAndFoldersToBotpress(props)
    }
  } finally {
    await _maybeRemoveLock(props)
  }
}

const _isSyncTypeDisabled = ({ configuration, event, logger }: types.EventHandlerProps['scheduledSync']) => {
  if (event.payload.syncType === 'real-time' && !configuration.enableRealTimeSync) {
    logger.info('Real-time sync is disabled. Ignoring sync event...', event.payload)
    return true
  } else if (event.payload.syncType === 'periodic' && !configuration.enablePeriodicSync) {
    logger.info('Periodic sync is disabled. Ignoring sync event...', event.payload)
    return true
  }
  return false
}

const _isAnotherSyncOperationInProgress = async ({
  client,
  ctx,
  event: {
    payload: { syncId },
  },
}: types.EventHandlerProps['scheduledSync']): Promise<boolean> => {
  const syncState = await _getSyncState({ client, ctx })

  return (syncState?.lock && syncState.lock.syncId !== syncId) ?? false
}

const _requeueSameEventWithDelay = async ({ client, event }: types.EventHandlerProps['scheduledSync']) => {
  await client.createEvent({
    type: 'scheduledSync',
    payload: event.payload,
    schedule: { delay: SYNC_REQUEUE_DELAY_MS },
  })
}

const _getSyncState = async ({
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

const _isFileItem = (
  item: types.EventHandlerProps['scheduledSync']['event']['payload']['itemToSync']
): item is bp.interfaces.Interfaces['files-readonly']['entities']['file'] & { path: string } => item?.type === 'file'

const _isFolderItem = (
  item: types.EventHandlerProps['scheduledSync']['event']['payload']['itemToSync']
): item is bp.interfaces.Interfaces['files-readonly']['entities']['folder'] & { path: string } =>
  item?.type === 'folder'

const _isFileIgnored = (
  { configuration }: types.EventHandlerProps['scheduledSync'],
  itemToSync: bp.interfaces.Interfaces['files-readonly']['entities']['file'] & { path: string }
) => {
  for (const { pathGlobPattern } of configuration.excludeFiles) {
    if (picomatch.isMatch(itemToSync.path, pathGlobPattern)) {
      return true
    }
  }

  for (const { pathGlobPattern, fileType, maxSizeInBytes, modifiedAfter } of configuration.includeFiles) {
    if (!picomatch.isMatch(itemToSync.path, pathGlobPattern)) {
      continue
    }

    if (fileType && fileType !== MediaTypes.mediaTypeToFileType(itemToSync.contentType)) {
      return true
    }

    if (maxSizeInBytes && itemToSync.sizeInBytes > maxSizeInBytes) {
      return true
    }

    if (
      modifiedAfter &&
      itemToSync.lastModifiedDate &&
      new Date(itemToSync.lastModifiedDate) < new Date(modifiedAfter)
    ) {
      return true
    }

    return false
  }

  return true
}

const _isFolderIgnored = (
  { configuration }: types.EventHandlerProps['scheduledSync'],
  itemToSync: bp.interfaces.Interfaces['files-readonly']['entities']['folder'] & { path: string }
) => {
  for (const { pathGlobPattern } of configuration.excludeFiles) {
    if (picomatch.isMatch(itemToSync.path, pathGlobPattern)) {
      return true
    }
  }

  return configuration.includeFiles.every(({ pathGlobPattern }) => !picomatch.isMatch(itemToSync.path, pathGlobPattern))
}

const _isIdenticalFileAlreadyUploaded = async (
  props: types.EventHandlerProps['scheduledSync'],
  itemToSync: bp.interfaces.Interfaces['files-readonly']['entities']['file']
) => {
  const { client, logger } = props

  const { files: existingFiles } = await client.listFiles({
    tags: {
      externalId: itemToSync.id,
      externalModifiedDate: itemToSync.lastModifiedDate,
      externalSize: itemToSync.sizeInBytes.toString(),
    },
  })

  if (existingFiles.length > 0) {
    logger.info('An identical file already exists in Botpress. Ignoring...', { file: existingFiles[0] })
    return true
  }

  return false
}

const _transferFileToBotpress = async (
  props: types.EventHandlerProps['scheduledSync'],
  itemToSync: bp.interfaces.Interfaces['files-readonly']['entities']['file']
) => {
  const { botpressFileId } = await props.actions['files-readonly'].transferFileToBotpress({ fileId: itemToSync.id })

  await props.client.updateFileMetadata({
    id: botpressFileId,
    metadata: {
      syncId: props.event.payload.syncId,
      syncInitiatedAt: props.event.payload.syncInitiatedAt,
      syncType: props.event.payload.syncType,
      integrationName: props.interfaces['files-readonly'].name,
    },
    tags: {
      externalId: itemToSync.id,
      externalModifiedDate: itemToSync.lastModifiedDate ?? null,
      externalSize: itemToSync.sizeInBytes.toString(),
    },
  })
}

const _transferFolderToBotpress = async (
  props: types.EventHandlerProps['scheduledSync'],
  itemToSync: bp.interfaces.Interfaces['files-readonly']['entities']['folder']
) => {
  const {
    items,
    meta: { nextToken },
  } = await props.actions['files-readonly'].listItemsInFolder({
    folderId: itemToSync.id,
    nextToken: props.event.payload.nextToken,
  })

  if (nextToken) {
    // Requeue same event with new nextToken:
    await props.client.createEvent({
      type: 'scheduledSync',
      payload: {
        ...props.event.payload,
        nextToken,
      },
      schedule: { delay: SYNC_IMMEDIATE_DELAY_MS },
    })
  }

  for (const item of items) {
    if (item.type === 'folder' && !props.event.payload.syncRecursively) {
      continue
    }

    await props.client.createEvent({
      type: 'scheduledSync',
      payload: {
        syncId: props.event.payload.syncId,
        syncType: props.event.payload.syncType,
        syncInitiatedAt: props.event.payload.syncInitiatedAt,
        itemToSync: item,
        syncRecursively: props.event.payload.syncRecursively,
      },
      schedule: { delay: SYNC_IMMEDIATE_DELAY_MS },
    })
  }
}

const _transferAllFilesAndFoldersToBotpress = async (props: types.EventHandlerProps['scheduledSync']) => {
  // sync all files and folders:
  const {
    items,
    meta: { nextToken },
  } = await props.actions['files-readonly'].listItemsInFolder({ nextToken: props.event.payload.nextToken })

  if (nextToken) {
    // Enqueue the next batch of items:
    await props.client.createEvent({
      type: 'scheduledSync',
      payload: {
        ...props.event.payload,
        nextToken,
      },
      schedule: { delay: SYNC_IMMEDIATE_DELAY_MS },
    })
  }

  for (const item of items) {
    if (item.type === 'folder' && !props.event.payload.syncRecursively) {
      // If this is a shallow sync, skip folders
      continue
    }

    await props.client.createEvent({
      type: 'scheduledSync',
      payload: {
        syncId: props.event.payload.syncId,
        syncType: props.event.payload.syncType,
        syncInitiatedAt: props.event.payload.syncInitiatedAt,
        itemToSync: item,
        syncRecursively: props.event.payload.syncRecursively,
      },
      schedule: { delay: SYNC_IMMEDIATE_DELAY_MS },
    })
  }
}

const _maybeRemoveLock = async (props: types.EventHandlerProps['scheduledSync']) => {
  // TODO: find a much less expensive way to do this, perhaps by increasing and decreasing a counter

  const { events: scheduledEvents } = await props.client.listEvents({ type: 'scheduledSync', status: 'scheduled' })
  const { events: pendingEvents } = await props.client.listEvents({ type: 'scheduledSync', status: 'pending' })
  const upcomingEvents = scheduledEvents.concat(pendingEvents)

  for (const event of upcomingEvents) {
    if (event.payload.syncId === props.event.payload.syncId) {
      return
    }
  }

  await props.client.setState({ id: props.ctx.botId, type: 'bot', name: 'fileSync', payload: { lock: null } })
}
