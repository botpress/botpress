import { handleEvent as handleFileCreated } from './file-created'
import { handleEvent as handleFileDeleted } from './file-deleted'
import { handleEvent as handleFileUpdated } from './file-updated'
import { handleEvent as handleFolderDeletedRecursive } from './folder-deleted-recursive'
import * as bp from '.botpress'

export const handleEvent: bp.EventHandlers['files-readonly:aggregateFileChanges'] = async (props) => {
  const modifiedItems = props.event.payload.modifiedItems

  for (const deletedItem of modifiedItems.deleted) {
    if (deletedItem.type === 'file') {
      await handleFileDeleted({
        ...props,
        event: { ...props.event, type: 'files-readonly:fileDeleted', payload: { file: deletedItem } },
      })
    } else {
      await handleFolderDeletedRecursive({
        ...props,
        event: { ...props.event, type: 'files-readonly:folderDeletedRecursive', payload: { folder: deletedItem } },
      })
    }
  }

  for (const createdItem of modifiedItems.created) {
    if (createdItem.type !== 'file') {
      continue
    }

    await handleFileCreated({
      ...props,
      event: { ...props.event, type: 'files-readonly:fileCreated', payload: { file: createdItem } },
    })
  }

  for (const updatedItem of modifiedItems.updated) {
    if (updatedItem.type !== 'file') {
      continue
    }

    await handleFileUpdated({
      ...props,
      event: { ...props.event, type: 'files-readonly:fileUpdated', payload: { file: updatedItem } },
    })
  }
}
