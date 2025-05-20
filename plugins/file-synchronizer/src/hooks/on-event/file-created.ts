import * as SyncQueue from '../../sync-queue'
import * as bp from '.botpress'

export const handleEvent: bp.EventHandlers['files-readonly:fileCreated'] = async (props) => {
  const createdFile = props.event.payload.file
  const globMatchResult = SyncQueue.globMatcher.matchItem({
    configuration: props.configuration,
    item: createdFile,
    itemPath: createdFile.absolutePath,
  })

  if (globMatchResult.shouldBeIgnored) {
    props.logger.debug(`Ignoring file ${createdFile.absolutePath}. Reason: ${globMatchResult.reason}`)
    return
  }

  await SyncQueue.fileProcessor.processQueueFile({
    fileRepository: props.client,
    fileToSync: {
      ...createdFile,
      status: 'pending',
      shouldIndex: (globMatchResult.shouldApplyOptions.addToKbId?.length ?? 0) > 0,
      addToKbId: globMatchResult.shouldApplyOptions.addToKbId,
    },
    integration: {
      ...props.interfaces['files-readonly'],
      transferFileToBotpress: props.actions['files-readonly'].transferFileToBotpress,
    },
    logger: props.logger,
  })

  props.logger.info(`File ${createdFile.absolutePath} has been synchronized`)
}
