import { getSyncQueue, updateSyncQueue } from '../../job-file'
import * as queueProcessor from '../../sync-queue-processor'
import * as bp from '.botpress'

export const handleEvent: bp.WorkflowHandlers['processQueue'] = async (props) => {
  const { syncQueue, key } = await getSyncQueue(props)
  const logger = props.logger.withWorkflowId(props.workflow.id)

  const { finished } = await queueProcessor.processQueue({
    logger,
    syncQueue,
    fileRepository: props.client,
    integration: { ...props.interfaces['files-readonly'], ...props.actions['files-readonly'] },
    updateSyncQueue: (params) => updateSyncQueue(props, key, params.syncQueue),
  })

  if (finished === 'batch') {
    logger.info('Batch sync success. Continuing to next batch...')
    return
  }

  logger.info('Sync completed successfully')
  await props.workflow.setCompleted()
}
