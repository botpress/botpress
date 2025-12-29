import * as boot from '../bootstrap'
import * as bp from '.botpress'

export const handleLinearIssueUpdated: bp.EventHandlers['linear:issueUpdated'] = async (props) => {
  const { event, logger } = props
  const { number: issueNumber, teamKey } = event.payload

  const { botpress, issueProcessor, recentlyLintedManager } = boot.bootstrap(props)

  const _handleError = (context: string) => (thrown: unknown) => botpress.handleError({ context }, thrown)
  logger.info('Linear issue updated event received', `${teamKey}-${issueNumber}`)
  const issue = await issueProcessor
    .findIssue(issueNumber, teamKey)
    .catch(_handleError('trying to find the updated Linear issue'))

  if (!issue) {
    return
  }

  const isRecentlyLinted = await recentlyLintedManager
    .isRecentlyLinted(issue)
    .catch(_handleError('trying to get recently linted issues'))

  await issueProcessor.lintIssue(issue, isRecentlyLinted).catch(_handleError('trying to lint the updated Linear issue'))
}
