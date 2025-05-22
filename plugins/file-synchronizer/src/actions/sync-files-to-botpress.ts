import { randomUUID } from '../crypto'
import * as bp from '.botpress'

export const callAction: bp.PluginHandlers['actionHandlers']['syncFilesToBotpess'] = async (props) => {
  if (await _isSyncAlreadyInProgress(props)) {
    props.logger.info('Sync is already in progress. Ignoring sync event...')
    return { status: 'already-running' }
  }

  const includeFiles = props.input.includeFiles ?? props.configuration.includeFiles
  const excludeFiles = props.input.excludeFiles ?? props.configuration.excludeFiles

  props.logger.info('Syncing files to Botpress...', {
    includeFiles,
    excludeFiles,
  })

  props.logger.info('Enumerating files...')
  await props.workflows.buildQueue.startNewInstance({
    input: { includeFiles, excludeFiles },
    tags: {
      syncJobId: await randomUUID(),
      syncType: 'manual',
      syncInitiatedAt: new Date().toISOString(),
    },
  })

  return { status: 'queued' }
}

const _isSyncAlreadyInProgress = async (props: bp.ActionHandlerProps) => {
  const { workflows: runningBuildQueueWorkflows } = await props.workflows.buildQueue.listInstances.running()

  if (runningBuildQueueWorkflows.length > 0) {
    return true
  }

  const { workflows: runningProcessQueueWorkflows } = await props.workflows.processQueue.listInstances.running()

  return runningProcessQueueWorkflows.length > 0
}
