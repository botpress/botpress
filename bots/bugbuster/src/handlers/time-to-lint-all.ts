import * as boot from '../bootstrap'
import * as slackNotifHelper from '../utils/slack-notifications-helper'
import * as bp from '.botpress'

export const handleTimeToLintAll: bp.EventHandlers['timeToLintAll'] = async (props) => {
  const { client, ctx, logger } = props
  logger.info("'timeToLintAll' event received.")

  const { botpress } = boot.bootstrap(props)

  const _handleError = (context: string, conversationId?: string) => (thrown: unknown) =>
    botpress.handleError({ context, conversationId }, thrown)

  const conversationId = await slackNotifHelper
    .tryGetConversationId(client, ctx.botId)
    .catch(_handleError('trying to get Slack notification channel'))

  await client
    .getOrCreateWorkflow({
      name: 'lintAll',
      input: {},
      discriminateByStatusGroup: 'active',
      conversationId,
      status: 'pending',
    })
    .catch(_handleError("trying to start the 'lintAll' workflow", conversationId))
}
