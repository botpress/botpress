import * as actions from './actions'
import * as hooks from './hooks'
import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {
    async syncFilesToBotpess(props) {
      props.logger.info('Called action syncFilesToBotpess')
      return await actions.syncFilesToBotpess.callAction(props)
    },
    async listSynchronizationOperations(props) {
      props.logger.info('Called action listSynchronizationOperations')
      throw new Error('Action not implemented.')
    },
    async checkSynchronizationStatus(props) {
      props.logger.info('Called action checkSynchronizationStatus')
      throw new Error('Action not implemented.')
    },
  },
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
