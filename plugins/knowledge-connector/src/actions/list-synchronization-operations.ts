import { WORKFLOW_ACTIVE_STATUSES } from 'src/consts'
import type { Workflow } from '../types'
import * as bp from '.botpress'

type SyncOperation = {
  integrationInstanceAlias: string
  startedAt: string
  syncJobId: string
}

export const callAction: bp.PluginHandlers['actionHandlers']['listSynchronizationOperations'] = async (props) => {
  const activeWorkflows = await props.workflows.processQueue
    .listInstances({ statuses: [...WORKFLOW_ACTIVE_STATUSES] })
    .take(100)

  const synchronizationsOperations = activeWorkflows.map(
    (workflow: Workflow): SyncOperation => ({
      integrationInstanceAlias: workflow.tags.integrationInstanceAlias || '',
      startedAt: workflow.tags.syncInitiatedAt || workflow.createdAt,
      syncJobId: workflow.tags.syncJobId || '',
    })
  )

  return {
    isBusy: synchronizationsOperations.length > 0,
    synchronizationsOperations,
  }
}
