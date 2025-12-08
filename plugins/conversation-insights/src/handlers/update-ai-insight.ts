import { isBrowser } from 'browser-or-node'
import * as bp from '.botpress'

export const handleUpdateAiInsight: bp.EventHandlers['updateAiInsight'] = async (props) => {
  if (isBrowser) {
    props.logger.error('This event is not supported by the browser')
    return
  }

  const workflows = await props.workflows.updateAllConversations
    .listInstances({ statuses: ['pending', 'cancelled', 'listening', 'paused'] })
    .take(1)

  if (workflows.length === 0) {
    await props.workflows.updateAllConversations.startNewInstance({ input: {} })
  }
}
