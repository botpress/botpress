import * as SyncQueue from '../../sync-queue'
import { createIntegrationTransferHandler } from '../../utils/create-integration-transfer-handler'
import * as bp from '.botpress'

export const handleEvent: bp.WorkflowHandlers['processQueue'] = async (props) => {
  const logger = props.logger.withWorkflowId(props.workflow.id)

  try {
    const { syncQueue, key } = await SyncQueue.jobFileManager.getSyncQueue(props)
    const hasKbTarget = syncQueue.some((item) => item.addToKbId !== undefined)

    if (
      !props.workflow.tags.integrationInstanceAlias ||
      !props.workflow.tags.syncJobId ||
      !props.workflow.tags.integrationDefinitionName ||
      !props.workflow.tags.syncInitiatedAt
    ) {
      throw new Error(
        'Missing required workflow tags: integrationInstanceAlias, integrationDefinitionName, syncJobId, and syncInitiatedAt'
      )
    }

    await props.workflow.acknowledgeStartOfProcessing()

    const processResult = await SyncQueue.queueProcessor.processQueue({
      logger,
      syncQueue,
      fileRepository: props.client,
      integration: createIntegrationTransferHandler({
        integrationName: props.workflow.tags.integrationDefinitionName,
        integrationAlias: props.workflow.tags.integrationInstanceAlias,
        client: props.client,
        transferFileToBotpressAlias: props.workflow.input.transferFileToBotpressAlias,
        shouldIndex: hasKbTarget,
      }),
      updateSyncQueue: (params) =>
        SyncQueue.jobFileManager.updateSyncQueue(props, key, params.syncQueue, {
          syncJobId: props.workflow.tags.syncJobId!,
          integrationName: props.workflow.tags.integrationDefinitionName!,
          integrationInstanceAlias: props.workflow.tags.integrationInstanceAlias!,
          syncInitiatedAt: props.workflow.tags.syncInitiatedAt!,
        }),
    })

    if (processResult.finished === 'batch') {
      logger.info('Batch sync success. Continuing to next batch...')
      const timeIn5Minutes = new Date(Date.now() + 300_000).toISOString()
      await props.workflow.update({ timeoutAt: timeIn5Minutes })
      return
    }

    logger.info('Sync completed successfully')
    await props.workflow.setCompleted()
  } catch (error) {
    logger.error('Error processing queue:', error)
    await props.workflow.setFailed({ failureReason: 'Error processing queue' })
    return
  }
}
