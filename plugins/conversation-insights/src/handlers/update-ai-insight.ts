import * as bp from '.botpress'

export const handleUpdateAiInsight: bp.EventHandlers['updateAiInsight'] = async (props) => {
  // Runs keep the default timeout, so the newest active run is the last one to
  // time out. Once it is past its timeout, every older active run is too, even
  // a run the Bridge never marked as timed out:
  const [newestActiveRun] = await props.workflows.updateAllConversations
    .listInstances({ statuses: ['pending', 'in_progress'] })
    .take(1)
  const isRunInProgress = newestActiveRun !== undefined && Date.parse(newestActiveRun.timeoutAt) > Date.now()

  if (!isRunInProgress) {
    await props.workflows.updateAllConversations.startNewInstance({ input: {} })
  }
}
