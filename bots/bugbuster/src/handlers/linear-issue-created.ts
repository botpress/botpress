import * as utils from '../utils'
import { findIssue, runLint } from './issue-processor'
import * as bp from '.botpress'

export const handleLinearIssueCreated: bp.EventHandlers['linear:issueCreated'] = async (props) => {
  const { number: issueNumber, teamKey } = props.event.payload
  const linear = await utils.linear.LinearApi.create()
  const issue = await findIssue(issueNumber, teamKey, props.logger, 'created', linear, props.client, props.ctx.botId)

  if (!issue) {
    return
  }

  await runLint(linear, issue, props.logger)
}
