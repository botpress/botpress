import * as utils from '../utils'
import { findIssue, runLint } from './issue-processor'
import { listWatchedTeams } from './teams-manager'
import * as bp from '.botpress'

export const handleLinearIssueUpdated: bp.EventHandlers['linear:issueUpdated'] = async (props) => {
  const { number: issueNumber, teamKey } = props.event.payload
  const linear = await utils.linear.LinearApi.create()

  const teams = await listWatchedTeams(props.client, props.ctx.botId)
  if (teamKey === undefined || !teams.result?.includes(teamKey)) {
    props.logger.error(`Ignoring issue of team "${teamKey}"`)
    return
  }

  const issue = await findIssue(issueNumber, teamKey, props.logger, 'updated', linear)
  if (!issue) {
    return
  }

  const botpress = await utils.botpress.BotpressApi.create(props)
  const recentlyLinted = await botpress.getRecentlyLinted()

  if (recentlyLinted.some(({ id: issueId }) => issue.id === issueId)) {
    props.logger.info(`Issue ${issue.identifier} has already been linted recently, skipping...`)
    return
  }

  await runLint(linear, issue, props.logger)
  await botpress.setRecentlyLinted([...recentlyLinted, { id: issue.id, lintedAt: new Date().toISOString() }])
}
