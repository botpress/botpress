import { extractIntegrationAlias } from '../../utils/extract-integration-alias'
import { handleEvent as handleFileCreated } from './file-created'
import { handleEvent as handleFileDeleted } from './file-deleted'
import { handleEvent as handleFileUpdated } from './file-updated'
import { handleEvent as handleFolderDeletedRecursive } from './folder-deleted-recursive'
import * as bp from '.botpress'

export const handleEvent: bp.EventHandlers['files-readonly:aggregateFileChanges'] = async (props) => {
  const modifiedItems = props.event.payload.modifiedItems
  const integrationAlias = extractIntegrationAlias(props.event.type, props.logger)
  if (!integrationAlias) {
    return
  }

  // Process deletes first to avoid conflicts with upserts
  const deletePromises = modifiedItems.deleted.map((deletedItem) => {
    if (deletedItem.type === 'file') {
      return handleFileDeleted({
        ...props,
        event: {
          ...props.event,
          type: `${integrationAlias}:fileDeleted` as 'files-readonly:fileDeleted',
          payload: { file: deletedItem },
        },
      })
    } else {
      return handleFolderDeletedRecursive({
        ...props,
        event: {
          ...props.event,
          type: `${integrationAlias}:folderDeletedRecursive` as 'files-readonly:folderDeletedRecursive',
          payload: { folder: deletedItem },
        },
      })
    }
  })

  await Promise.allSettled(deletePromises)

  const upsertPromises: Promise<void>[] = []

  for (const createdItem of modifiedItems.created) {
    if (createdItem.type !== 'file') {
      continue
    }

    upsertPromises.push(
      handleFileCreated({
        ...props,
        event: {
          ...props.event,
          type: `${integrationAlias}:fileCreated` as 'files-readonly:fileCreated',
          payload: { file: createdItem },
        },
      })
    )
  }

  for (const updatedItem of modifiedItems.updated) {
    if (updatedItem.type !== 'file') {
      continue
    }

    upsertPromises.push(
      handleFileUpdated({
        ...props,
        event: {
          ...props.event,
          type: `${integrationAlias}:fileUpdated` as 'files-readonly:fileUpdated',
          payload: { file: updatedItem },
        },
      })
    )
  }

  await Promise.allSettled(upsertPromises)
}
