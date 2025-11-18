import { BotClient, BotContext, BotLogger } from '@botpress/sdk/dist/bot'
import { Result } from 'src/types'
import { BotpressApi } from 'src/utils/botpress-utils'
import { handleError } from 'src/utils/error-handler'
import { LinearApi } from 'src/utils/linear-utils'
import { listIssues, runLints } from './issue-processor'
import { listTeams } from './teams-manager'
import { TBot } from '.botpress'

export const lintAll = async (
  client: BotClient<TBot>,
  logger: BotLogger,
  ctx: BotContext,
  conversationId: string,
  lastLintedIdSetter: (id: string) => Promise<any>,
  lastLintedId?: string
): Promise<Result<void>> => {
  const _handleError = (context: string) => handleError(context, logger, botpress, conversationId)
  const botpress = new BotpressApi(client, ctx)

  const teamsResult = await listTeams(client, ctx.botId).catch(_handleError('trying to lint all issues'))
  if (!teamsResult.success || !teamsResult.result) {
    return { success: false, message: teamsResult.message }
  }

  const linear = await LinearApi.create().catch(_handleError('trying to lint all issues'))
  const issues = await listIssues(teamsResult.result, linear, lastLintedId).catch(
    _handleError('trying to list all issues')
  )

  await runLints(linear, issues, logger, lastLintedIdSetter).catch(_handleError('trying to run lints on all issues'))
  return { success: true, message: 'linted all issues' }
}
