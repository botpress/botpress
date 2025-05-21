import * as SyncQueue from '../../sync-queue'
import * as bp from '.botpress'

export const handleEvent: bp.WorkflowHandlers['buildQueue'] = async (props) => {
  props.logger.info('Retrieving job file...')
  const { syncQueue, key } = await SyncQueue.jobFileManager.getSyncQueue(props)

  props.logger.info('Enumerating files...')
  const enumerationState = await SyncQueue.directoryTraversalWithBatching.enumerateAllFilesRecursive({
    ...props,
    currentEnumerationState: props.workflow.output.enumerationState,
    pushFilesToQueue: async (files) => {
      const dedupedQueue = new Map(syncQueue.map((file) => [file.id, file]))
      files.forEach((file) => dedupedQueue.set(file.id, { ...file, status: 'pending' } as const))
      await SyncQueue.jobFileManager.updateSyncQueue(props, key, Array.from(dedupedQueue.values()), props.workflow.tags)
    },
    integration: { listItemsInFolder: props.actions['files-readonly'].listItemsInFolder },
  })

  if (enumerationState !== undefined) {
    // Enumeration is still in progress
    props.logger.debug('Enumeration partially completed')
    const timeIn5Minutes = new Date(Date.now() + 300_000).toISOString()
    const previousOutput = props.workflow.output as bp.workflows.buildQueue.output.Output
    await props.workflow.update({
      timeoutAt: timeIn5Minutes,
      output: { ...previousOutput, enumerationState },
    })
    return
  }

  props.logger.info('Enumeration completed. Starting sync job...')
  await props.workflow.setCompleted()
  await props.workflows.processQueue.startNewInstance({
    input: { jobFileId: props.workflow.output.jobFileId! },
    tags: {
      syncInitiatedAt: props.workflow.tags.syncInitiatedAt!,
      syncJobId: props.workflow.tags.syncJobId!,
      syncType: props.workflow.tags.syncType!,
    },
  })
}
