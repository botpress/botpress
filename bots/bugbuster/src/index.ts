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
  const {
    client,
    ctx,
    workflow: {
      input: { conversationId },
    },
  } = props

  await props.workflow.setFailed({ failureReason: 'Workflow timed out' })

  const botpress = new BotpressApi(client, ctx)
  await botpress.respondText(conversationId, 'Workflow timed out')
})

const handleLintAllWorkflow = async (props: bp.WorkflowHandlerProps['lintAll']) => {
  const { client, logger, ctx, workflow } = props
  const conversationId = workflow.input.conversationId
  await workflow.acknowledgeStartOfProcessing()

  const botpress = new BotpressApi(client, ctx)

  const result = await lintAll(client, logger, ctx, conversationId)

  if (!result.success) {
    await workflow.setFailed({ failureReason: result.message })
    await botpress.respondText(conversationId, LINT_ALL_ERROR_PREFIX + result.message)
    return
  }
  await botpress.respondText(conversationId, 'Success: ' + result.message)

  await workflow.setCompleted()
}

export default bot
