import * as sdk from '@botpress/sdk'
import { WORKFLOW_ACTIVE_STATUSES } from 'src/consts'
import * as models from '../../definitions/models'
import * as utils from '../utils'
import * as bp from '.botpress'

const QUEUE_ITEM_SCHEMA = models.FILE_WITH_PATH.extend({
  status: sdk.z.enum(['pending', 'newly-synced', 'already-synced', 'errored']),
  errorMessage: sdk.z.string().optional(),
  addToKbId: sdk.z.string().optional(),
})

type Workflow = Awaited<ReturnType<bp.Client['listWorkflows']>>['workflows'][number]

type WorkflowStatusResult = {
  currentStatus: 'inProgress' | 'completed' | 'failed'
  failureReason?: string
  endedAt?: string
}

type FileStats = {
  totalFiles: number
  processedFiles: number
  skippedFiles: number
  failedFiles: number
}

export const callAction: bp.PluginHandlers['actionHandlers']['checkSynchronizationStatus'] = async (props) => {
  const { syncJobId } = props.input

  props.logger.info(`Checking synchronization status for sync job with ID "${syncJobId}"`)

  const allWorkflows = await props.workflows.processQueue.listInstances({ tags: { syncJobId } }).take(1)

  if (allWorkflows.length === 0) {
    props.logger.warn(`No workflow found for sync job with ID "${syncJobId}"`)
    return createNotFoundResponse(syncJobId)
  }

  const workflow = allWorkflows[0]!
  const integrationInstanceAlias = workflow.tags.integrationInstanceAlias || ''
  const startedAt = workflow.tags.syncInitiatedAt || workflow.createdAt

  const statusResult = getWorkflowStatusResult(workflow)

  let fileStats: FileStats = {
    totalFiles: 0,
    processedFiles: 0,
    skippedFiles: 0,
    failedFiles: 0,
  }

  if (workflow.input.jobFileId) {
    try {
      const { file: jobFile } = await props.client.getFile({ id: workflow.input.jobFileId })
      const jobFileContent = await fetch(jobFile.url).then((res) => res.text())
      fileStats = computeFileStats(jobFileContent, props.logger)
    } catch (error) {
      props.logger.error(`Failed to retrieve sync queue file: ${error}`)
    }
  }

  return {
    ...statusResult,
    integrationInstanceAlias,
    startedAt,
    ...fileStats,
  }
}

const getWorkflowStatusResult = (workflow: Workflow): WorkflowStatusResult => {
  if (WORKFLOW_ACTIVE_STATUSES.includes(workflow.status as (typeof WORKFLOW_ACTIVE_STATUSES)[number])) {
    return { currentStatus: 'inProgress' }
  }

  if (workflow.status === 'completed') {
    return { currentStatus: 'completed', endedAt: workflow.updatedAt }
  }

  if (workflow.status === 'failed') {
    return {
      currentStatus: 'failed',
      failureReason: workflow.failureReason || 'Synchronization failed',
      endedAt: workflow.updatedAt,
    }
  }

  return {
    currentStatus: 'failed',
    failureReason: `Workflow ended with status: ${workflow.status}`,
    endedAt: workflow.updatedAt,
  }
}

const computeFileStats = (jobFileContent: string, logger: sdk.BotLogger): FileStats => {
  const stats: FileStats = {
    totalFiles: 0,
    processedFiles: 0,
    skippedFiles: 0,
    failedFiles: 0,
  }

  const syncQueueGenerator = utils.jsonl.parseJsonLines(jobFileContent, QUEUE_ITEM_SCHEMA)

  for (const item of syncQueueGenerator) {
    if ('error' in item) {
      logger.error('Error while parsing line in job file. This line will be ignored.', item)
      continue
    }

    stats.totalFiles++

    switch (item.value.status) {
      case 'newly-synced':
        stats.processedFiles++
        break
      case 'already-synced':
        stats.processedFiles++
        stats.skippedFiles++
        break
      case 'errored':
        stats.failedFiles++
        break
    }
  }

  return stats
}

const createNotFoundResponse = (syncJobId: string) => ({
  currentStatus: 'failed' as const,
  failureReason: `No synchronization job found with ID "${syncJobId}"`,
  integrationInstanceAlias: '',
  startedAt: '',
  endedAt: undefined,
  totalFiles: 0,
  processedFiles: 0,
  skippedFiles: 0,
  failedFiles: 0,
})
