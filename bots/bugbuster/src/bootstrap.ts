import { CommandProcessor } from './services/command-processor'
import { IssueProcessor } from './services/issue-processor'
import { IssueStateChecker } from './services/issue-state-checker'
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
  const issueStateChecker = new IssueStateChecker(linear, logger)
  const commandProcessor = new CommandProcessor(client, teamsManager, ctx.botId)

  return {
    botpress,
    linear,
    teamsManager,
    recentlyLintedManager,
    issueProcessor,
    issueStateChecker,
    commandProcessor,
  }
}
