import * as actions from './actions'
import * as hooks from './hooks'
import * as onEventAggregate from './hooks/on-event/aggregate-file-changes'
import * as onEventFileCreated from './hooks/on-event/file-created'
import * as onEventFileDeleted from './hooks/on-event/file-deleted'
import * as onEventFileUpdated from './hooks/on-event/file-updated'
import * as onEventFolderDeleted from './hooks/on-event/folder-deleted-recursive'
import * as onEventScheduledSync from './hooks/on-event/scheduled-sync'
import { hasEnabledFolders } from './utils/has-enabled-folders'
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
    await onEventFileDeleted.handleEvent(props as any)
  } catch (error) {
    props.logger.error(`fileDeleted error: ${error instanceof Error ? error.message : String(error)}`)
  }
})

plugin.on.event('files-readonly:folderDeletedRecursive', async (props) => {
  try {
    await onEventFolderDeleted.handleEvent(props as any)
  } catch (error) {
    props.logger.error(`folderDeletedRecursive error: ${error instanceof Error ? error.message : String(error)}`)
  }
})

plugin.on.event('files-readonly:aggregateFileChanges', async (props) => {
  try {
    await onEventAggregate.handleEvent(props as any)
  } catch (error) {
    props.logger.error(`aggregateFileChanges error: ${error instanceof Error ? error.message : String(error)}`)
  }
})

plugin.on.event('files-readonly:fileCreated', async (props) => {
  try {
    let settings
    try {
      settings = await props.states.bot.folderSyncSettings.get(props.ctx.botId)
    } catch {
      return
    }

    if (!settings?.settings || !hasEnabledFolders(settings.settings)) {
      return
    }

    await onEventFileCreated.handleEvent(props as any)
  } catch (error) {
    props.logger.error(`fileCreated error: ${error instanceof Error ? error.message : String(error)}`)
  }
})

plugin.on.event('files-readonly:fileUpdated', async (props) => {
  try {
    let settings
    try {
      settings = await props.states.bot.folderSyncSettings.get(props.ctx.botId)
    } catch {
      return
    }

    if (!settings?.settings || !hasEnabledFolders(settings.settings)) {
      return
    }

    await onEventFileUpdated.handleEvent(props as any)
  } catch (error) {
    props.logger.error(`fileUpdated error: ${error instanceof Error ? error.message : String(error)}`)
  }
})

plugin.on.event('scheduledSync', async (props) => {
  props.logger.info('[scheduledSync] Event received', {
    configuration: props.configuration,
    botId: props.ctx.botId,
  })
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
