import * as boot from '../bootstrap'
import * as slackNotifHelper from '../utils/slack-notifications-helper'
import * as bp from '.botpress'

export const handleTimeToLintAll: bp.EventHandlers['timeToLintAll'] = async (props) => {
  const { client, ctx, workflows, logger } = props
  logger.info("'timeToLintAll' event received.")

  const { botpress } = boot.bootstrap(props)

  const _handleError = (context: string, conversationId?: string) => (thrown: unknown) =>
    botpress.handleError({ context, conversationId }, thrown)

  const conversationId = await slackNotifHelper
    .tryGetConversationId(client, ctx.botId)
    .catch(_handleError('trying to get Slack notification channel'))
  await workflows.lintAll
    .startNewInstance({ input: {}, conversationId })
    .catch(_handleError("trying to start the 'lintAll' workflow", conversationId))
}
