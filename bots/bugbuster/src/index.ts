import * as handlers from './handlers'
import { BotpressApi } from './utils/botpress-utils'
import * as bp from '.botpress'

export const bot = new bp.Bot({ actions: {} })

bot.on.event('github:issueOpened', handlers.handleGithubIssueOpened)
bot.on.event('linear:issueUpdated', handlers.handleLinearIssueUpdated)
bot.on.event('linear:issueCreated', handlers.handleLinearIssueCreated)
bot.on.message('*', handlers.handleMessageCreated)

bot.on.workflowStart('lintAll', handlers.handleLintAll)
bot.on.workflowContinue('lintAll', handlers.handleLintAll)
bot.on.workflowTimeout('lintAll', async (props) => {
  const { client, ctx, conversation } = props

  const botpress = new BotpressApi(client, ctx.botId)
  if (conversation?.id) {
    await botpress.respondText(conversation.id, "Error: the 'lintAll' operation timed out")
  }
})

export default bot
