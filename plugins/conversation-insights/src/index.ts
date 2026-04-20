import { isBrowser } from 'browser-or-node'
import { handleError } from './error-handler'
import * as handlers from './handlers'
import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {},
})

plugin.on.afterIncomingMessage('*', async (props) => {
  if (isBrowser) {
    return
  }
  return await handlers
    .handleAfterIncomingMessage(props)
    .catch(handleError({ context: 'trying to process an incoming message', logger: props.logger }))
})

plugin.on.afterOutgoingMessage('*', async (props) => {
  if (isBrowser) {
    return
  }
  return await handlers
    .handleAfterOutgoingMessage(props)
    .catch(handleError({ context: 'trying to process an outgoing message', logger: props.logger }))
})

plugin.on.event('updateAiInsight', async (props) => {
  if (isBrowser) {
    props.logger.error('This event is not supported by the browser')
    return
  }
  return await handlers
    .handleUpdateAiInsight(props)
    .catch(handleError({ context: 'trying to update an AI insight', logger: props.logger }))
})

plugin.on.workflowStart('updateAllConversations', async (props) => {
  return await handlers
    .handleStartUpdateAllConversations(props)
    .catch(handleError({ context: 'trying to start the updateAllConversations workflow', logger: props.logger }))
})

plugin.on.workflowContinue('updateAllConversations', async (props) => {
  return await handlers
    .handleContinueUpdateAllConversations(props)
    .catch(handleError({ context: 'trying to continue the updateAllConversations workflow', logger: props.logger }))
})

plugin.on.workflowTimeout('updateAllConversations', async (props) => {
  return await handlers.handleTimeoutUpdateAllConversations(props).catch(
    handleError({
      context: 'trying to process the timeout of the updateAllConversations workflow',
      logger: props.logger,
    })
  )
})

export default plugin
