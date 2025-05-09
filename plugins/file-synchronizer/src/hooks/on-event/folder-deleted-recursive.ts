import * as SyncQueue from '../../sync-queue'
import * as bp from '.botpress'

export const handleEvent: bp.EventHandlers['files-readonly:folderDeletedRecursive'] = async (props) => {
  const deletedFolder = props.event.payload.folder
  const globMatchResult = SyncQueue.globMatcher.matchItem({
    configuration: props.configuration,
    item: deletedFolder,
    itemPath: deletedFolder.absolutePath,
  })

  if (globMatchResult.shouldBeIgnored) {
    props.logger.debug(`Ignoring folder ${deletedFolder.absolutePath}. Reason: ${globMatchResult.reason}`)
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
