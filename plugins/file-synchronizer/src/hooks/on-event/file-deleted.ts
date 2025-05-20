import * as SyncQueue from '../../sync-queue'
import * as bp from '.botpress'

export const handleEvent: bp.EventHandlers['files-readonly:fileDeleted'] = async (props) => {
  const deletedFile = props.event.payload.file
  const globMatchResult = SyncQueue.globMatcher.matchItem({
    configuration: props.configuration,
    item: deletedFile,
    itemPath: deletedFile.absolutePath,
  })

  if (globMatchResult.shouldBeIgnored) {
    props.logger.debug(`Ignoring file ${deletedFile.absolutePath}. Reason: ${globMatchResult.reason}`)
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
