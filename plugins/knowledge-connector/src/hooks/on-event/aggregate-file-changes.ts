import { extractIntegrationAlias } from '../../utils/extract-integration-alias'
import { handleEvent as handleFileCreated } from './file-created'
import { handleEvent as handleFileDeleted } from './file-deleted'
import { handleEvent as handleFileUpdated } from './file-updated'
import { handleEvent as handleFolderDeletedRecursive } from './folder-deleted-recursive'
import * as bp from '.botpress'

const _getErrorMessage = (reason: unknown): string => (reason instanceof Error ? reason.message : String(reason))

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

  const deleteResults = await Promise.allSettled(deletePromises)
  deleteResults.forEach((result, index) => {
    if (result.status !== 'rejected') {
      return
    }

    const deletedItem = modifiedItems.deleted[index]
    const itemPath = deletedItem?.absolutePath ?? deletedItem?.id ?? 'unknown'
    props.logger.error(
      `Failed to process deleted item ${itemPath} during aggregateFileChanges: ${_getErrorMessage(result.reason)}`
    )
  })

  const upsertPromises: Promise<void>[] = []
  const createdFiles = modifiedItems.created.filter(
    (item): item is (typeof modifiedItems.created)[number] & { type: 'file' } => item.type === 'file'
  )
  const updatedFiles = modifiedItems.updated.filter(
    (item): item is (typeof modifiedItems.updated)[number] & { type: 'file' } => item.type === 'file'
  )

  for (const createdItem of createdFiles) {
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

  for (const updatedItem of updatedFiles) {
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

  const upsertResults = await Promise.allSettled(upsertPromises)
  upsertResults.forEach((result, index) => {
    if (result.status !== 'rejected') {
      return
    }

    // TODO: Add retry/requeue handling for failed aggregate upserts.
    const sourceItem = index < createdFiles.length ? createdFiles[index] : updatedFiles[index - createdFiles.length]
    const itemPath = sourceItem?.absolutePath ?? sourceItem?.id ?? 'unknown'
    props.logger.error(
      `Failed to process upserted file ${itemPath} during aggregateFileChanges: ${_getErrorMessage(result.reason)}`
    )
  })
}
