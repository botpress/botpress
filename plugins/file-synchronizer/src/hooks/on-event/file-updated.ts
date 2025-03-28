import * as SyncQueue from '../../sync-queue'
import * as bp from '.botpress'

export const handleEvent: bp.EventHandlers['files-readonly:fileUpdated'] = async (props) => {
  const updatedFile = props.event.payload.file
  const shouldIgnore = SyncQueue.globMatcher.shouldItemBeIgnored({
    configuration: props.configuration,
    item: updatedFile,
    itemPath: updatedFile.absolutePath,
  })

  if (shouldIgnore) {
    props.logger.debug(`Ignoring file ${updatedFile.absolutePath} because it does not match any include pattern`)
    return
  }

  await SyncQueue.fileProcessor.processQueueFile({
    fileRepository: props.client,
    fileToSync: { ...updatedFile, status: 'pending' },
    integration: {
      ...props.interfaces['files-readonly'],
      transferFileToBotpress: props.actions['files-readonly'].transferFileToBotpress,
    },
    logger: props.logger,
  })

  props.logger.info(`File ${updatedFile.absolutePath} has been synchronized`)
}
