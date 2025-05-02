import * as SyncQueue from '../../sync-queue'
import * as bp from '.botpress'

export const handleEvent: bp.EventHandlers['files-readonly:fileUpdated'] = async (props) => {
  const updatedFile = props.event.payload.file
  const globMatchResult = SyncQueue.globMatcher.matchItem({
    configuration: props.configuration,
    item: updatedFile,
    itemPath: updatedFile.absolutePath,
  })

  if (globMatchResult.shouldBeIgnored) {
    props.logger.debug(`Ignoring file ${updatedFile.absolutePath}. Reason: ${globMatchResult.reason}`)
    return
  }

  await SyncQueue.fileProcessor.processQueueFile({
    fileRepository: props.client,
    fileToSync: { ...updatedFile, status: 'pending', shouldIndex: globMatchResult.shouldApplyOptions.index ?? false },
    integration: {
      ...props.interfaces['files-readonly'],
      transferFileToBotpress: props.actions['files-readonly'].transferFileToBotpress,
    },
    logger: props.logger,
  })

  props.logger.info(`File ${updatedFile.absolutePath} has been synchronized`)
}
