import * as utils from '../utils'
import { IssueProcessor } from './issue-processor'
import * as bp from '.botpress'

export const handleLinearIssueCreated: bp.EventHandlers['linear:issueCreated'] = async (props) => {
  const { client, event, logger, ctx } = props
  const { number: issueNumber, teamKey } = event.payload
  const linear = await utils.linear.LinearApi.create()
  const issueProcessor = new IssueProcessor(logger, linear, client, ctx.botId)
  const issue = await issueProcessor.findIssue(issueNumber, teamKey, 'created')

  if (!issue) {
    return
  }

  await issueProcessor.runLint(issue)
}
