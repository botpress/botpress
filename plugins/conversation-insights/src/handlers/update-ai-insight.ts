import * as bp from '.botpress'

export const handleUpdateAiInsight: bp.EventHandlers['updateAiInsight'] = async (props) => {
  const workflows = await props.workflows.updateAllConversations
    .listInstances({ statuses: ['pending', 'cancelled', 'listening', 'paused'] })
    .take(1)

  if (workflows.length === 0) {
    await props.workflows.updateAllConversations.startNewInstance({ input: {} })
  }
}
