import * as boot from '../bootstrap'
import * as bp from '.botpress'

export const handleLinearIssueCreated: bp.EventHandlers['linear:issueCreated'] = async (props) => {
  const { event } = props
  const { number: issueNumber, teamKey } = event.payload

  const { botpress, issueProcessor } = await boot.bootstrap(props)

  const _handleError = (context: string) => (thrown: unknown) => botpress.handleError({ context }, thrown)

  props.logger.info('Linear issue created event received', `${teamKey}-${issueNumber}`)
  const issue = await issueProcessor
    .findIssue(issueNumber, teamKey)
    .catch(_handleError('trying to find the created Linear issue'))

  if (!issue) {
    return
  }

  await issueProcessor.lintIssue(issue).catch(_handleError('trying to lint the created Linear issue'))
}
