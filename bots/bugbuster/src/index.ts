import * as handlers from './handlers'
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

  const botpress = new BotpressApi(client, ctx.botId)
  if (conversationId) {
    await botpress.respondText(conversationId, "Error: the 'lintAll' operation timed out")
  }
})

const handleLintAllWorkflow = async (props: bp.WorkflowHandlerProps['lintAll']) => {
  const { client, logger, ctx, workflow, conversation } = props
  const conversationId = conversation?.id
  const botpress = new BotpressApi(client, ctx.botId)

  try {
    const result = await handlers.lintAll(client, logger, ctx, workflow, conversationId)
    if (!result.success) {
      if (conversationId) {
        await botpress.respondText(conversationId, LINT_ALL_ERROR_PREFIX + result.message)
      }
      await workflow.setFailed({ failureReason: result.message })
      return
    }
    if (conversationId) {
      await botpress.respondText(conversationId, result.message)
    }
    await workflow.setCompleted()
  } catch {
    return
  }
}

export default bot
