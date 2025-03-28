import * as actions from './actions'
import * as hooks from './hooks'
import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {
    async syncFilesToBotpess(props) {
      props.logger.info('Called action syncFilesToBotpess')
      return await actions.syncFilesToBotpess.callAction(props)
    },
    async listItemsInFolder(props) {
      props.logger.info('Called action listItemsInFolder. Redirecting to integration...')
      return await props.actions['files-readonly'].listItemsInFolder(props.input)
    },
  },
})

plugin.on.event('periodicSync', async (props) => {
  props.logger.info('Periodic sync event triggered')
  await hooks.onEvent.periodicSync.handleEvent(props)
})

plugin.on.event('files-readonly:fileCreated', async (props) => {
  props.logger.info('File created event triggered', props.event.payload.file)
  await hooks.onEvent.fileCreated.handleEvent(props)
})

plugin.on.event('files-readonly:fileDeleted', async (props) => {
  props.logger.info('File deleted event triggered', props.event.payload.file)
  await hooks.onEvent.fileDeleted.handleEvent(props)
})

plugin.on.event('files-readonly:fileUpdated', async (props) => {
  props.logger.info('File updated event triggered', props.event.payload.file)
  await hooks.onEvent.fileUpdated.handleEvent(props)
})

plugin.on.event('files-readonly:folderDeletedRecursive', async (props) => {
  props.logger.info('Folder deleted event triggered', props.event.payload.folder)
  await hooks.onEvent.folderDeletedRecursive.handleEvent(props)
})

plugin.on.event('files-readonly:aggregateFileChanges', async (props) => {
  props.logger.info('Aggregate file changes event triggered', props.event.payload.modifiedItems)
  await hooks.onEvent.aggregateFileChanges.handleEvent(props)
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
