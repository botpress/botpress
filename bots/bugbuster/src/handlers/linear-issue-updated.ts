import * as boot from '../bootstrap'
import * as bp from '.botpress'

export const handleLinearIssueUpdated: bp.EventHandlers['linear:issueUpdated'] = async (props) => {
  const { event, logger } = props
  const { number: issueNumber, teamKey } = event.payload

  const { botpress, issueProcessor } = await boot.bootstrap(props)

  const _handleError = (context: string) => (thrown: unknown) => botpress.handleError({ context }, thrown)

  props.logger.info('Linear issue updated event received', `${teamKey}-${issueNumber}`)
  const issue = await issueProcessor
    .findIssue(issueNumber, teamKey)
    .catch(_handleError('trying to find the updated Linear issue'))

  if (!issue) {
    return
  }

  const recentlyLinted = await botpress.getRecentlyLinted().catch(_handleError('trying to get recently linted issues'))

  if (recentlyLinted.some(({ id: issueId }) => issue.id === issueId)) {
    logger.info(`Issue ${issue.identifier} has already been linted recently, skipping...`)
    return
  }

  await issueProcessor.lintIssue(issue).catch(_handleError('trying to lint the updated Linear issue'))
  await botpress
    .setRecentlyLinted([...recentlyLinted, { id: issue.id, lintedAt: new Date().toISOString() }])
    .catch(_handleError('trying to update recently linted issues'))
}
