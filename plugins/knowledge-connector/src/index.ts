import * as actions from './actions'
import * as hooks from './hooks'
import * as onEventAggregate from './hooks/on-event/aggregate-file-changes'
import * as onEventFileCreated from './hooks/on-event/file-created'
import * as onEventFileDeleted from './hooks/on-event/file-deleted'
import * as onEventFileUpdated from './hooks/on-event/file-updated'
import * as onEventFolderDeleted from './hooks/on-event/folder-deleted-recursive'
import * as onEventScheduledSync from './hooks/on-event/scheduled-sync'
import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {
    syncFilesToBotpress: (props) => actions.syncFilesToBotpress.callAction(props),
    listSynchronizationOperations: (props) => actions.listSynchronizationOperations.callAction(props),
    checkSynchronizationStatus: (props) => actions.checkSynchronizationStatus.callAction(props),
  },
})

plugin.on.event('files-readonly:fileDeleted', async (props) => {
  try {
    await onEventFileDeleted.handleEvent(props)
  } catch (error) {
    props.logger.error(`fileDeleted error: ${error instanceof Error ? error.message : String(error)}`)
  }
})

plugin.on.event('files-readonly:folderDeletedRecursive', async (props) => {
  try {
    await onEventFolderDeleted.handleEvent(props)
  } catch (error) {
    props.logger.error(`folderDeletedRecursive error: ${error instanceof Error ? error.message : String(error)}`)
  }
})

plugin.on.event('files-readonly:aggregateFileChanges', async (props) => {
  try {
    await onEventAggregate.handleEvent(props)
  } catch (error) {
    props.logger.error(`aggregateFileChanges error: ${error instanceof Error ? error.message : String(error)}`)
  }
})

plugin.on.event('files-readonly:fileCreated', async (props) => {
  try {
    await onEventFileCreated.handleEvent(props)
  } catch (error) {
    props.logger.error(`fileCreated error: ${error instanceof Error ? error.message : String(error)}`)
  }
})

plugin.on.event('files-readonly:fileUpdated', async (props) => {
  try {
    await onEventFileUpdated.handleEvent(props)
  } catch (error) {
    props.logger.error(`fileUpdated error: ${error instanceof Error ? error.message : String(error)}`)
  }
})

plugin.on.event('scheduledSync', async (props) => {
  try {
    await onEventScheduledSync.handleEvent(props)
  } catch (error) {
    props.logger.error(`scheduledSync error: ${error instanceof Error ? error.message : String(error)}`)
  }
})

plugin.on.workflowStart('processQueue', async (props) => {
  props.logger.info('processQueue workflow started', props.workflow.tags)
  await hooks.onWorkflowStart.processQueue.handleEvent(props)
})

plugin.on.workflowContinue('processQueue', async (props) => {
  props.logger.info('processQueue workflow continued', props.workflow.tags)
  await hooks.onWorkflowContinue.processQueue.handleEvent(props)
})

plugin.on.workflowTimeout('processQueue', async (props) => {
  props.logger.info('processQueue workflow timed out', props.workflow.tags)
  await hooks.onWorkflowTimeout.processQueue.handleEvent(props)
})

export default plugin
