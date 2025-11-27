import * as bp from '.botpress'
import * as boot from '../bootstrap'

export const handleLintAll: bp.WorkflowHandlers['lintAll'] = async (props) => {
  const { client, workflow, conversation } = props

  const conversationId = conversation?.id

  const { botpress, teamsManager, issueProcessor } = await boot.bootstrap(props, conversationId)

  const _handleError = (context: string) => (thrown: unknown) =>
    botpress.handleError({ context, conversationId }, thrown)

  const teams = await teamsManager.listTeams().catch(_handleError('trying to lint all issues'))

  const {
    state: {
      payload: { id: lastLintedId },
    },
  } = await client
    .getOrSetState({
      id: workflow.id,
      name: 'lastLintedId',
      type: 'workflow',
      payload: {},
    })
    .catch(_handleError('trying to get last linted issue ID'))

  const issues = await issueProcessor
    .listIssues(teams, lastLintedId) // TODO: we should not list all issues at first, bug fetch next page and lint progressively
    .catch(_handleError('trying to list all issues'))

  for (const issue of issues) {
    await issueProcessor.runLint(issue).catch(_handleError(`trying to lint issue ${issue.identifier}`))
    await workflow.acknowledgeStartOfProcessing().catch(_handleError('trying to acknowledge start of processing'))
    await client
      .setState({
        id: workflow.id,
        name: 'lastLintedId',
        type: 'workflow',
        payload: { id: issue.id },
      })
      .catch(_handleError('trying to update last linted issue ID'))
  }

  if (conversationId) {
    await botpress.respondText(conversationId, 'linted all issues').catch(() => {})
  }

  await workflow.setCompleted()
}
