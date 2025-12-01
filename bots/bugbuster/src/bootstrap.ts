import { IssueProcessor } from './services/issue-processor'
import { IssueStatusChecker } from './services/issue-status-checker'
import { RecentlyLintedManager } from './services/recently-linted-manager'
import { TeamsManager } from './services/teams-manager'
import * as types from './types'
import * as utils from './utils'

export const bootstrap = (props: types.CommonHandlerProps) => {
  const { client, logger, ctx } = props
  const botpress = utils.botpress.BotpressApi.create(props)

  const linear = utils.linear.LinearApi.create()
  const teamsManager = new TeamsManager(linear, client, ctx.botId)
  const recentlyLintedManager = new RecentlyLintedManager(linear)
  const issueProcessor = new IssueProcessor(logger, linear, teamsManager)
  const issueStatusChecker = new IssueStatusChecker(linear)

  return {
    botpress,
    linear,
    teamsManager,
    recentlyLintedManager,
    issueProcessor,
    issueStatusChecker,
  }
}
