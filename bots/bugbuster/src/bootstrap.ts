import { BotpressApi } from 'src/utils/botpress-utils'
import { handleError } from 'src/utils/error-handler'
import { LinearApi } from 'src/utils/linear-utils'
import { IssueProcessor } from './services/issue-processor'
import { TeamsManager } from './services/teams-manager'
import { WorkflowHandlerProps, MessageHandlerProps, EventHandlerProps } from '.botpress'

export type BootstrapProps = WorkflowHandlerProps['lintAll'] | MessageHandlerProps | EventHandlerProps
export const bootstrap = async (props: BootstrapProps, conversationId?: string) => {
  const { client, logger, ctx } = props
  const botpress = new BotpressApi(client, ctx.botId)
  const _handleError = (context: string) => handleError({ context, logger, botpress, conversationId })

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
