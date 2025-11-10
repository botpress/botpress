import * as utils from '../utils'
import { findIssue, runLint } from './issue-processor'
import { listWatchedTeams } from './teams-manager'
import * as bp from '.botpress'

export const handleLinearIssueCreated: bp.EventHandlers['linear:issueCreated'] = async (props) => {
  const { number: issueNumber, teamKey } = props.event.payload
  const linear = await utils.linear.LinearApi.create()

  const teams = await listWatchedTeams(props.client, props.ctx.botId)
  if (teamKey === undefined || !teams.result?.includes(teamKey)) {
    props.logger.error(`Ignoring issue of team "${teamKey}"`)
    return
  }

  const issue = await findIssue(issueNumber, teamKey, props.logger, 'created', linear)
  if (!issue) {
    return
  }

  await runLint(linear, issue, props.logger)
}
