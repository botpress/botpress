import * as errorWrapper from './error-wrapper'
import * as handlers from './handlers'
import * as bp from '.botpress'

const plugin = new bp.Plugin({
  actions: {},
})

plugin.on.afterIncomingMessage(
  '*',
  errorWrapper.wrap(handlers.handleAfterIncomingMessage, 'trying to process an incoming message')
)

plugin.on.afterOutgoingMessage(
  '*',
  errorWrapper.wrap(handlers.handleAfterOutgoingMessage, 'trying to process an outgoing message')
)

plugin.on.event('updateAiInsight', errorWrapper.wrap(handlers.handleUpdateAiInsight, 'trying to update an AI insight'))

plugin.on.workflowStart(
  'updateAllConversations',
  errorWrapper.wrap(handlers.handleStartUpdateAllConversations, 'trying to start the updateAllConversations workflow')
)

plugin.on.workflowContinue(
  'updateAllConversations',
  errorWrapper.wrap(
    handlers.handleContinueUpdateAllConversations,
    'trying to continue the updateAllConversations workflow'
  )
)

plugin.on.workflowTimeout(
  'updateAllConversations',
  errorWrapper.wrap(
    handlers.handleStartUpdateAllConversations,
    'trying to process the timeout of the updateAllConversations workflow'
  )
)

export default plugin
