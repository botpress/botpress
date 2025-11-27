import { BotpressApi } from 'src/utils/botpress-utils'
import { handleError } from 'src/utils/error-handler'
import { LinearApi } from 'src/utils/linear-utils'
import { IssueProcessor } from './issue-processor'
import { listTeams } from './teams-manager'
import { WorkflowHandlerProps } from '.botpress'

export const handleLintAll = async (props: WorkflowHandlerProps['lintAll']): Promise<void> => {
  const { client, logger, ctx, workflow, conversation } = props
  const _handleError = (context: string) => handleError({ context, logger, botpress, conversationId })

  const conversationId = conversation?.id
  const botpress = new BotpressApi(client, ctx.botId)
  const teamsResult = await listTeams(client, ctx.botId).catch(_handleError('trying to lint all issues'))

  if (!teamsResult.success || !teamsResult.result) {
    const error = new Error(teamsResult.message)
    await _handleError('listing teams')(error)
    return
  }

  const lastLintedId = await client.getOrSetState({
    id: workflow.id,
    name: 'lastLintedId',
    type: 'workflow',
    payload: {},
  })

  const linear = await LinearApi.create().catch(_handleError('trying to lint all issues'))
  const issueProcessor = new IssueProcessor(logger, linear, client, ctx.botId)
  const issues = await issueProcessor
    .listIssues(teamsResult.result, lastLintedId.state.payload.id)
    .catch(_handleError('trying to list all issues'))

  for (const issue of issues) {
    try {
      await issueProcessor.runLint(issue)
      await workflow.acknowledgeStartOfProcessing()
    } catch {
      return
    }
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
