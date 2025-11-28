import { IssueProcessor } from './services/issue-processor'
import { TeamsManager } from './services/teams-manager'
import * as types from './types'
import * as utils from './utils'

export const bootstrap = async (props: types.CommonHandlerProps, conversationId?: string) => {
  const { client, logger, ctx } = props
  const botpress = utils.botpress.BotpressApi.create(props)

  const _handleError = (context: string) => (thrown: unknown) =>
    botpress.handleError({ context, conversationId }, thrown)

  // TODO: make this synchronous so it won't slow down bootstraping or throw
  const linear = await utils.linear.LinearApi.create().catch(_handleError('trying to initialize Linear API'))
  const teamsManager = new TeamsManager(linear, client, ctx.botId)
  const issueProcessor = new IssueProcessor(logger, linear, teamsManager)

  return {
    botpress,
    linear,
    teamsManager,
    issueProcessor,
  }
}
