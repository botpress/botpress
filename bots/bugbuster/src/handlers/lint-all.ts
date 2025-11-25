import { BotClient, BotContext, BotLogger } from '@botpress/sdk/dist/bot'
import { LintResult, Result } from 'src/types'
import { BotpressApi } from 'src/utils/botpress-utils'
import { handleError } from 'src/utils/error-handler'
import { LinearApi } from 'src/utils/linear-utils'
import { IssueProcessor } from './issue-processor'
import { listTeams } from './teams-manager'
import { TBot, WorkflowHandlerProps } from '.botpress'

export const lintAll = async (
  client: BotClient<TBot>,
  logger: BotLogger,
  ctx: BotContext,
  workflow: WorkflowHandlerProps['lintAll']['workflow'],
  conversationId?: string
): Promise<Result<void>> => {
  const _handleError = (context: string) => handleError({ context, logger, botpress, conversationId })
  const botpress = new BotpressApi(client, ctx.botId)

  const teamsResult = await listTeams(client, ctx.botId).catch(_handleError('trying to lint all issues'))
  if (!teamsResult.success || !teamsResult.result) {
    return { success: false, message: teamsResult.message }
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

  const results = await issueProcessor
    .runLints(issues, workflow)
    .catch(_handleError('trying to run lints on all issues'))
  return { success: true, message: buildResultMessage(results) }
}

const buildResultMessage = (results: LintResult[]) => {
  const failedIssuesLinks = results.filter((result) => result.result === 'failed').map((result) => result.identifier)

  let messageDetail = 'No issues contained lint errors.'
  if (failedIssuesLinks.length === 1) {
    messageDetail = `This issue contained lint errors: ${failedIssuesLinks[0]}.`
  } else if (failedIssuesLinks.length > 1) {
    messageDetail = `These issues contained lint errors: ${failedIssuesLinks.join(', ')}.`
  }

  return `All issues linted. ${messageDetail}`
}
