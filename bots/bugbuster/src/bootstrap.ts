import { CommandProcessor } from './services/command-processor'
import { CommentService } from './services/comment-service'
import { IssueProcessor } from './services/issue-processor'
import { IssueStateChecker } from './services/issue-state-checker'
import { StateService } from './services/state-service'
import { TeamsManager } from './services/teams-manager'
import * as utils from './utils'

export const bootstrap = (props: utils.botpress.CommonHandlerProps) => {
  const { client, logger, ctx } = props
  const botpress = utils.botpress.BotpressApi.create(props)

  const linear = utils.linear.LinearApi.create(client)
  const stateService = new StateService(linear)
  const teamsManager = new TeamsManager(linear, client, ctx.botId)
  const commentService = new CommentService(linear, ctx.botId)
  const issueProcessor = new IssueProcessor(logger, linear, commentService, stateService, teamsManager)
  const issueStateChecker = new IssueStateChecker(linear, commentService, stateService, logger)
  const commandProcessor = new CommandProcessor(client, teamsManager, ctx.botId)

  return {
    botpress,
    linear,
    stateService,
    teamsManager,
    commentService,
    issueProcessor,
    issueStateChecker,
    commandProcessor,
  }
}
