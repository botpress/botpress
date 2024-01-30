import { bot } from './bot'
import { handleNewIssue, handleSyncIssuesRequest } from './handlers'

bot.event(async (props) => {
  const { event } = props
  if (event.type === 'github:issueOpened') {
    return handleNewIssue(props, event)
  }

  if (event.type === 'syncIssuesRequest') {
    return handleSyncIssuesRequest(props, event)
  }
})

export default bot
