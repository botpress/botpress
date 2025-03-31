import * as SyncQueue from '../../sync-queue'
import * as bp from '.botpress'

export const handleEvent: bp.EventHandlers['files-readonly:fileDeleted'] = async (props) => {
  const deletedFile = props.event.payload.file
  const shouldIgnore = SyncQueue.globMatcher.shouldItemBeIgnored({
    configuration: props.configuration,
    item: deletedFile,
    itemPath: deletedFile.absolutePath,
  })

  if (shouldIgnore) {
    props.logger.debug(`Ignoring file ${deletedFile.absolutePath} because it does not match any include pattern`)
    return
  }

  try {
    const { files } = await props.client.listFiles({ tags: { externalId: deletedFile.id } })

    for (const filesApiFile of files) {
      await props.client.deleteFile({ id: filesApiFile.id })

      props.logger.info(`File ${deletedFile.absolutePath} has been deleted`)
    }
  } catch {}
}
