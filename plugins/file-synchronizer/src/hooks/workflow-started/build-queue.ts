import * as sdk from '@botpress/sdk'
import * as SyncQueue from '../../sync-queue'
import * as bp from '.botpress'

export const handleEvent: bp.WorkflowHandlers['buildQueue'] = async (props) => {
  props.logger.info('Creating job file...')
  const syncFileKey = _generateFileKey(props)
  const jobFileId = await SyncQueue.jobFileManager.updateSyncQueue(props, syncFileKey, [], props.workflow.tags)

  await props.workflow.update({ output: { jobFileId } })
}

const _generateFileKey = (props: bp.WorkflowHandlerProps['buildQueue']) => {
  const integrationName = props.interfaces['files-readonly'].name
  const syncJobId = props.workflow.tags.syncJobId

  if (!syncJobId) {
    throw new sdk.RuntimeError('Sync job ID is not defined in workflow tags')
  }

  return `file-synchronizer:${integrationName}:/${syncJobId}.jsonl`
}
