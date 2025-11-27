import * as utils from '../utils'
import * as bp from '.botpress'
import { bootstrap } from 'src/bootstrap'

export const handleLinearIssueUpdated: bp.EventHandlers['linear:issueUpdated'] = async (props) => {
  const { event, logger } = props
  const { number: issueNumber, teamKey } = event.payload

  const { issueProcessor } = await bootstrap(props)

  const issue = await issueProcessor.findIssue(issueNumber, teamKey, 'updated')

  if (!issue) {
    return
  }

  const botpress = await utils.botpress.BotpressApi.create(props)
  const recentlyLinted = await botpress.getRecentlyLinted()

  if (recentlyLinted.some(({ id: issueId }) => issue.id === issueId)) {
    logger.info(`Issue ${issue.identifier} has already been linted recently, skipping...`)
    return
  }

  await issueProcessor.runLint(issue)
  await botpress.setRecentlyLinted([...recentlyLinted, { id: issue.id, lintedAt: new Date().toISOString() }])
}
