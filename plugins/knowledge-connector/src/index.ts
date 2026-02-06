import * as actions from './actions'
import * as hooks from './hooks'
import * as onEventAggregate from './hooks/on-event/aggregate-file-changes'
import * as onEventFileCreated from './hooks/on-event/file-created'
import * as onEventFileDeleted from './hooks/on-event/file-deleted'
import * as onEventFileUpdated from './hooks/on-event/file-updated'
import * as onEventFolderDeleted from './hooks/on-event/folder-deleted-recursive'
import { hasEnabledFolders } from './utils/has-enabled-folders'
import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {
    async syncFilesToBotpress(props) {
      props.logger.info('Called action syncFilesToBotpress')
      return await actions.syncFilesToBotpress.callAction(props)
    },
    async listSynchronizationOperations(props) {
      props.logger.info('Called action listSynchronizationOperations')
      return await actions.listSynchronizationOperations.callAction(props)
    },
    async checkSynchronizationStatus(props) {
      props.logger.info('Called action checkSynchronizationStatus')
      return await actions.checkSynchronizationStatus.callAction(props)
    },
  },
})

plugin.on.event('*', async (props) => {
  const folderSyncSettingsState = await props.client.getState({
    type: 'bot',
    id: props.ctx.botId,
    name: 'folderSyncSettings',
  })

  if (!folderSyncSettingsState?.state?.payload?.settings) {
    return
  }

  if (!hasEnabledFolders(folderSyncSettingsState.state.payload.settings)) {
    return
  }

  const eventType = props.event.type
  if (eventType.endsWith(':fileCreated')) {
    props.logger.info('File created event triggered', props.event.payload.file)
    await onEventFileCreated.handleEvent(props)
  } else if (eventType.endsWith(':fileDeleted')) {
    props.logger.info('File deleted event triggered', props.event.payload.file)
    await onEventFileDeleted.handleEvent(props)
  } else if (eventType.endsWith(':fileUpdated')) {
    props.logger.info('File updated event triggered', props.event.payload.file)
    await onEventFileUpdated.handleEvent(props)
  } else if (eventType.endsWith(':folderDeletedRecursive')) {
    props.logger.info('Folder deleted event triggered', props.event.payload.folder)
    await onEventFolderDeleted.handleEvent(props)
  } else if (eventType.endsWith(':aggregateFileChanges')) {
    props.logger.info('Aggregate file changes event triggered', props.event.payload.modifiedItems)
    await onEventAggregate.handleEvent(props)
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
