import { BotpressApi } from 'src/utils/botpress-utils'
import { LinearApi } from 'src/utils/linear-utils'
import { IssueProcessor } from './services/issue-processor'
import { TeamsManager } from './services/teams-manager'
import * as types from './types'

export const bootstrap = async (props: types.CommonHandlerProps, conversationId?: string) => {
  const { client, logger, ctx } = props
  const botpress = await BotpressApi.create(props)

  const _handleError = (context: string) => (thrown: unknown) =>
    botpress.handleError({ context, conversationId }, thrown)

  const linear = await LinearApi.create().catch(_handleError('trying to initialize Linear API'))
  const teamsManager = new TeamsManager(linear, client, ctx.botId)
  const issueProcessor = new IssueProcessor(logger, linear, teamsManager)

  return {
    botpress,
    linear,
    teamsManager,
    issueProcessor,
  }
}
