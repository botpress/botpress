import { BotLogger } from '@botpress/sdk'
import * as handlers from './handlers'
import { lintAll } from './handlers/lint-all'
import { BotpressApi } from './utils/botpress-utils'
import * as bp from '.botpress'

export const bot = new bp.Bot({ actions: {} })

bot.on.event('github:issueOpened', handlers.handleGithubIssueOpened)
bot.on.event('linear:issueUpdated', handlers.handleLinearIssueUpdated)
bot.on.event('linear:issueCreated', handlers.handleLinearIssueCreated)
bot.on.message('*', handlers.handleMessageCreated)

const LINT_ALL_ERROR_PREFIX = "Error during the 'lintAll' workflow: "

bot.on.workflowStart('lintAll', async (props) => {
  await handleLintAllWorkflow(props)
})

bot.on.workflowContinue('lintAll', async (props) => {
  await handleLintAllWorkflow(props)
})

bot.on.workflowTimeout('lintAll', async (props) => {
  const { client, ctx, logger, conversation } = props
  await props.workflow.setFailed({ failureReason: 'Workflow timed out' })

  const botpress = new BotpressApi(client, ctx)
  await sendMessageOrLog(botpress, logger, 'Workflow timed out', conversation?.id)
})

const sendMessageOrLog = async (botpress: BotpressApi, logger: BotLogger, message: string, conversationId?: string) => {
  if (conversationId) {
    await botpress.respondText(conversationId, message)
  } else {
    logger.info(message)
  }
}

const handleLintAllWorkflow = async (props: bp.WorkflowHandlerProps['lintAll']) => {
  const { client, logger, ctx, conversation, workflow } = props
  await workflow.acknowledgeStartOfProcessing()

  const _sendMessageOrLog = async (message: string) => sendMessageOrLog(botpress, logger, message, conversation?.id)
  const botpress = new BotpressApi(client, ctx)

  const result = await lintAll(client, logger, ctx, conversation?.id)

  if (!result.success) {
    await workflow.setFailed({ failureReason: result.message })
    await _sendMessageOrLog(LINT_ALL_ERROR_PREFIX + result.message)
    return
  }
  await _sendMessageOrLog('Success: ' + result.message)

  await workflow.setCompleted()
}

export default bot
