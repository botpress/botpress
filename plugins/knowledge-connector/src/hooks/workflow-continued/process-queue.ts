import * as SyncQueue from '../../sync-queue'
import { createIntegrationTransferHandler } from '../../utils/create-integration-transfer-handler'
import * as bp from '.botpress'

export const handleEvent: bp.WorkflowHandlers['processQueue'] = async (props) => {
  const { syncQueue, key } = await SyncQueue.jobFileManager.getSyncQueue(props)
  const logger = props.logger.withWorkflowId(props.workflow.id)

  if (
    !props.workflow.tags.integrationInstanceAlias ||
    !props.workflow.tags.syncJobId ||
    !props.workflow.tags.integrationDefinitionName
  ) {
    throw new Error(
      'Missing required workflow tags: integrationInstanceAlias, integrationDefinitionName, and syncJobId'
    )
  }

  await props.workflow.acknowledgeStartOfProcessing()

  const { finished } = await SyncQueue.queueProcessor.processQueue({
    logger,
    syncQueue,
    fileRepository: props.client,
    integration: createIntegrationTransferHandler({
      integrationName: props.workflow.tags.integrationDefinitionName,
      integrationAlias: props.workflow.tags.integrationInstanceAlias,
      client: props.client,
      transferFileToBotpressAlias: props.workflow.input.transferFileToBotpressAlias,
      shouldIndex: true,
    }),
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
