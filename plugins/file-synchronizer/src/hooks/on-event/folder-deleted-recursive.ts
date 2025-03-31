import * as SyncQueue from '../../sync-queue'
import * as bp from '.botpress'

export const handleEvent: bp.EventHandlers['files-readonly:folderDeletedRecursive'] = async (props) => {
  const deletedFolder = props.event.payload.folder
  const shouldIgnore = SyncQueue.globMatcher.shouldItemBeIgnored({
    configuration: props.configuration,
    item: deletedFolder,
    itemPath: deletedFolder.absolutePath,
  })

  if (shouldIgnore) {
    props.logger.debug(`Ignoring folder ${deletedFolder.absolutePath} because it does not match any include pattern`)
    return
  }

  try {
    const { files } = await props.client.listFiles({ tags: { externalParentId: deletedFolder.id } })

    for (const filesApiFile of files) {
      await props.client.deleteFile({ id: filesApiFile.id })

      props.logger.info(`File ${deletedFolder.absolutePath} has been deleted`)
    }
  } catch {}
}
