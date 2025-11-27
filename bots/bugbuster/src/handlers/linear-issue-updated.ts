import * as bp from '.botpress'
import * as boot from 'src/bootstrap'

export const handleLinearIssueUpdated: bp.EventHandlers['linear:issueUpdated'] = async (props) => {
  const { event, logger } = props
  const { number: issueNumber, teamKey } = event.payload

  const { botpress, issueProcessor } = await boot.bootstrap(props)

  const issue = await issueProcessor
    .findIssue(issueNumber, teamKey, 'updated')
    .catch((thrown) => botpress.handleError({ context: 'trying to find the updated Linear issue' }, thrown))

  if (!issue) {
    return
  }

  const recentlyLinted = await botpress.getRecentlyLinted()

  if (recentlyLinted.some(({ id: issueId }) => issue.id === issueId)) {
    logger.info(`Issue ${issue.identifier} has already been linted recently, skipping...`)
    return
  }

  await issueProcessor.runLint(issue)
  await botpress.setRecentlyLinted([...recentlyLinted, { id: issue.id, lintedAt: new Date().toISOString() }])
}
