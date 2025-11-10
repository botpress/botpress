import * as utils from '../utils'
import { getIssue, runLint } from './issue-processor'
import * as bp from '.botpress'

export const handleLinearIssueCreated: bp.EventHandlers['linear:issueCreated'] = async (props) => {
  const { number: issueNumber, teamKey } = props.event.payload
  const linear = await utils.linear.LinearApi.create()
  const issue = await getIssue(issueNumber, teamKey, props.logger, 'created', linear)

  if (!issue) {
    return
  }

  await runLint(linear, issue, props.logger)
}
