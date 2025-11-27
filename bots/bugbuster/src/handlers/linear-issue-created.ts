import * as bp from '.botpress'
import * as boot from '../bootstrap'

export const handleLinearIssueCreated: bp.EventHandlers['linear:issueCreated'] = async (props) => {
  const { event } = props
  const { number: issueNumber, teamKey } = event.payload

  const { botpress, issueProcessor } = await boot.bootstrap(props)
  const issue = await issueProcessor
    .findIssue(issueNumber, teamKey, 'created')
    .catch((thrown) => botpress.handleError({ context: 'trying to find the created Linear issue' }, thrown))

  if (!issue) {
    return
  }

  await issueProcessor.runLint(issue)
}
