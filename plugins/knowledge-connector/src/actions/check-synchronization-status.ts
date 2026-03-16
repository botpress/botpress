import * as sdk from '@botpress/sdk'
import { WORKFLOW_ACTIVE_STATUSES } from '../consts'
import { QUEUE_ITEM_SCHEMA, type Workflow } from '../types'
import * as utils from '../utils'
import * as bp from '.botpress'

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

  props.logger.debug(`Checking synchronization status for sync job with ID "${syncJobId}"`)

  const allWorkflows = await props.workflows.processQueue.listInstances({ tags: { syncJobId } }).take(1)

  if (allWorkflows.length === 0) {
    props.logger.warn(`No workflow found for sync job with ID "${syncJobId}"`)
    return _createNotFoundResponse(syncJobId)
  }

  const workflow = allWorkflows[0]!
  const integrationInstanceAlias = workflow.tags.integrationInstanceAlias || ''
  const startedAt = workflow.tags.syncInitiatedAt || workflow.createdAt

  const statusResult = _getWorkflowStatusResult(workflow)

  let fileStats: FileStats = {
    totalFiles: 0,
    processedFiles: 0,
    skippedFiles: 0,
    failedFiles: 0,
  }

  if (workflow.input.jobFileId) {
    try {
      const { file: jobFile } = await props.client.getFile({ id: workflow.input.jobFileId })
      const res = await fetch(jobFile.url, { signal: AbortSignal.timeout(30000) })
      if (!res.ok) {
        throw new Error(`Failed to download sync queue file: HTTP ${res.status} ${res.statusText}`)
      }
      const jobFileContent = await res.text()
      fileStats = _computeFileStats(jobFileContent, props.logger)
    } catch (error) {
      props.logger.error(`Failed to retrieve sync queue file: ${error}. File stats will be unavailable.`)
      fileStats = {
        totalFiles: -1,
        processedFiles: -1,
        skippedFiles: -1,
        failedFiles: -1,
      }
    }
  }

  return {
    ...statusResult,
    integrationInstanceAlias,
    startedAt,
    ...fileStats,
  }
}

const _getWorkflowStatusResult = (workflow: Workflow): WorkflowStatusResult => {
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

const _computeFileStats = (jobFileContent: string, logger: sdk.BotLogger): FileStats => {
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

const _createNotFoundResponse = (syncJobId: string) => ({
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
