import * as handlers from './handlers'
import * as bp from '.botpress'

export const bot = new bp.Bot({ actions: {} })

bot.on.event('github:issueOpened', handlers.handleGithubIssueOpened)
bot.on.event('linear:issueUpdated', handlers.handleLinearIssueUpdated)
bot.on.event('linear:issueCreated', handlers.handleLinearIssueCreated)
bot.on.message('*', handlers.handleMessageCreated)

bot.on.workflowStart('lintAll', handlers.handleLintAll)
bot.on.workflowContinue('lintAll', handlers.handleLintAll)
bot.on.workflowTimeout('lintAll', handlers.handleLintAllTimeout)

export default bot
