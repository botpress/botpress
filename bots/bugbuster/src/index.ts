import * as handlers from './handlers'
import * as bp from '.botpress'

export const bot = new bp.Bot({ actions: {} })

bot.on.event('github:issueOpened', handlers.handleGithubIssueOpened)
bot.on.event('syncIssuesRequest', handlers.handleSyncIssuesRequest)
bot.on.event('linear:issueUpdated', handlers.handleLinearIssueUpdated)
bot.on.message('*', handlers.handleMessageCreated)

export default bot
