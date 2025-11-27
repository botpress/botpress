import { handleError } from 'src/utils/error-handler'
import { WorkflowHandlerProps } from '.botpress'
import { bootstrap } from 'src/bootstrap'

export const handleLintAll = async (props: WorkflowHandlerProps['lintAll']): Promise<void> => {
  const { client, logger, workflow, conversation } = props
  const _handleError = (context: string) => handleError({ context, logger, botpress, conversationId })

  const conversationId = conversation?.id

  const { botpress, teamsManager, issueProcessor } = await bootstrap(props, conversationId)
  const teams = await teamsManager.listTeams().catch(_handleError('trying to lint all issues'))

  const {
    state: {
      payload: { id: lastLintedId },
    },
  } = await client.getOrSetState({
    id: workflow.id,
    name: 'lastLintedId',
    type: 'workflow',
    payload: {},
  })

  const issues = await issueProcessor
    .listIssues(teams, lastLintedId) // TODO: we should not list all issues at first, bug fetch next page and lint progressively
    .catch(_handleError('trying to list all issues'))

  for (const issue of issues) {
    await issueProcessor.runLint(issue)
    await workflow.acknowledgeStartOfProcessing()
    await client.setState({
      id: workflow.id,
      name: 'lastLintedId',
      type: 'workflow',
      payload: { id: issue.id },
    })
  }

  if (conversationId) {
    await botpress.respondText(conversationId, 'linted all issues')
  }

  await workflow.setCompleted()
}
