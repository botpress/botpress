import * as SyncQueue from '../../sync-queue'
import * as bp from '.botpress'

export const handleEvent: bp.WorkflowHandlers['buildQueue'] = async (props) => {
  props.logger.info('Retrieving job file...')
  const workflowState = await props.states.workflow.buildQueueRuntimeState.get(props.workflow.id)
  const { syncQueue, key } = await SyncQueue.jobFileManager.getSyncQueue(props, workflowState.jobFileId)

  props.logger.info('Enumerating files...')
  const enumerationState = await SyncQueue.directoryTraversalWithBatching.enumerateAllFilesRecursive(
    _getEnumerateAllFilesRecursiveProps(props, syncQueue, key, workflowState)
  )

  if (enumerationState !== undefined) {
    // Enumeration is still in progress
    props.logger.debug('Enumeration partially completed')
    const timeIn5Minutes = new Date(Date.now() + 300_000).toISOString()
    await props.workflow.update({ timeoutAt: timeIn5Minutes })
    await props.states.workflow.buildQueueRuntimeState.set(props.workflow.id, { ...workflowState, enumerationState })
    return
  }

  props.logger.info('Enumeration completed. Starting sync job...')
  await props.workflow.setCompleted()
  await props.workflows.processQueue.startNewInstance({
    input: { jobFileId: workflowState.jobFileId },
    tags: {
      syncInitiatedAt: props.workflow.tags.syncInitiatedAt!,
      syncJobId: props.workflow.tags.syncJobId!,
      syncType: props.workflow.tags.syncType!,
    },
  })
}

const _getEnumerateAllFilesRecursiveProps = (
  props: bp.WorkflowHandlerProps['buildQueue'],
  syncQueue: SyncQueue.queueProcessor.ProcessQueueProps['syncQueue'],
  syncFileKey: string,
  workflowState: bp.states.States['buildQueueRuntimeState']['payload']
): SyncQueue.directoryTraversalWithBatching.EnumerateAllFilesRecursiveProps => ({
  ...props,

  currentEnumerationState: workflowState.enumerationState,
  integration: { listItemsInFolder: props.actions['files-readonly'].listItemsInFolder },

  async pushFilesToQueue(files) {
    if (!files.length) {
      return
    }

    const dedupedQueue = new Map(syncQueue.map((file) => [file.id, file]))
    files.forEach((file) => dedupedQueue.set(file.id, { ...file, status: 'pending' } as const))

    await SyncQueue.jobFileManager.updateSyncQueue(
      props,
      syncFileKey,
      Array.from(dedupedQueue.values()),
      props.workflow.tags
    )
  },
})
