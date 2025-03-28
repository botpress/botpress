import * as SyncQueue from '../../sync-queue'
import * as bp from '.botpress'

export const handleEvent: bp.EventHandlers['files-readonly:fileCreated'] = async (props) => {
  const createdFile = props.event.payload.file
  const shouldIgnore = SyncQueue.globMatcher.shouldItemBeIgnored({
    configuration: props.configuration,
    item: createdFile,
    itemPath: createdFile.absolutePath,
  })

  if (shouldIgnore) {
    props.logger.debug(`Ignoring file ${createdFile.absolutePath} because it does not match any include pattern`)
    return
  }

  await SyncQueue.fileProcessor.processQueueFile({
    fileRepository: props.client,
    fileToSync: { ...createdFile, status: 'pending' },
    integration: {
      ...props.interfaces['files-readonly'],
      transferFileToBotpress: props.actions['files-readonly'].transferFileToBotpress,
    },
    logger: props.logger,
  })

  props.logger.info(`File ${createdFile.absolutePath} has been synchronized`)
}
