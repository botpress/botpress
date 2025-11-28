import { IssueProcessor } from './services/issue-processor'
import { RecentlyLintedManager } from './services/recently-linted-manager'
import { TeamsManager } from './services/teams-manager'
import * as types from './types'
import * as utils from './utils'

export const bootstrap = async (props: types.CommonHandlerProps, conversationId?: string) => {
  const { client, logger, ctx } = props
  const botpress = utils.botpress.BotpressApi.create(props)

  const _handleError = (context: string) => (thrown: unknown) =>
    botpress.handleError({ context, conversationId }, thrown)

  const linear = await utils.linear.LinearApi.create()
  const teamsManager = new TeamsManager(linear, client, ctx.botId)
  const recentlyLintedManager = new RecentlyLintedManager(client, ctx.botId)
  const issueProcessor = new IssueProcessor(logger, linear, teamsManager)

  return {
    botpress,
    linear,
    teamsManager,
    recentlyLintedManager,
    issueProcessor,
  }
}
