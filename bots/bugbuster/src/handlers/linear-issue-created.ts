import * as bp from '.botpress'
import { bootstrap } from 'src/bootstrap'

export const handleLinearIssueCreated: bp.EventHandlers['linear:issueCreated'] = async (props) => {
  const { event } = props
  const { number: issueNumber, teamKey } = event.payload

  const { issueProcessor } = await bootstrap(props)
  const issue = await issueProcessor.findIssue(issueNumber, teamKey, 'created')

  if (!issue) {
    return
  }

  await issueProcessor.runLint(issue)
}
