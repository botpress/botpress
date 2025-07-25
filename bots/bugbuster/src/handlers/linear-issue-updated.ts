import * as linlint from '../linear-lint-issue'
import * as utils from '../utils'
import * as bp from '.botpress'

export const handleLinearIssueUpdated: bp.EventHandlers['linear:issueUpdated'] = async (props) => {
  const { number: issueNumber, teamKey } = props.event.payload
  if (!issueNumber || !teamKey) {
    props.logger.error('Missing issueNumber or teamKey in event payload')
    return
  }

  props.logger.info('Linear issue updated event received', `${teamKey}-${issueNumber}`)

  const linear = await utils.linear.LinearApi.create()

  if (!linear.isTeam(teamKey) || teamKey !== 'SQD') {
    props.logger.error(`Ignoring issue of team "${teamKey}"`)
    return
  }

  const issue = await linear.findIssue({ teamKey, issueNumber })
  if (!issue) {
    props.logger.error(`Issue with number ${issueNumber} not found in team ${teamKey}`)
    return
  }

  const errors = await linlint.lintIssue(linear, issue)
  if (errors.length === 0) {
    props.logger.info(`Issue ${issue.identifier} passed all lint checks.`)
    return
  }

  // TODO: add a debounce mechanism to avoid multiple comments on the same issue

  await linear.client.createComment({
    issueId: issue.id,
    body: [
      `BugBuster Bot found the following problems with ${issue.identifier}:`,
      '',
      ...errors.map((error) => `- ${error.message}`),
    ].join('\n'),
  })
}
