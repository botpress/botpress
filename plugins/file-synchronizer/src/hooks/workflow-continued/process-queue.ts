import * as SyncQueue from '../../sync-queue'
import * as bp from '.botpress'

export const handleEvent: bp.WorkflowHandlers['processQueue'] = async (props) => {
  const { syncQueue, key } = await SyncQueue.jobFileManager.getSyncQueue(props)
  const logger = props.logger.withWorkflowId(props.workflow.id)

  const { finished } = await SyncQueue.queueProcessor.processQueue({
    logger,
    syncQueue,
    fileRepository: props.client,
    integration: {
      ...props.interfaces['files-readonly'],
      transferFileToBotpress: props.actions['files-readonly'].transferFileToBotpress,
    },
    updateSyncQueue: (params) => SyncQueue.jobFileManager.updateSyncQueue(props, key, params.syncQueue),
  })

  if (finished === 'batch') {
    logger.info('Batch sync success. Continuing to next batch...')
    const timeIn5Minutes = new Date(Date.now() + 300_000).toISOString()
    await props.workflow.update({ timeoutAt: timeIn5Minutes })
    return
  }

  logger.info('Sync completed successfully')
  await props.workflow.setCompleted()
}
