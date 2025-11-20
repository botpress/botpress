import { BotpressApi } from 'src/utils/botpress-utils'
import { handleError } from 'src/utils/error-handler'
import { StatusCheckExecutor } from 'src/utils/status-check-executor'
import * as utils from '../utils'
import { listTeams } from './teams-manager'
import * as bp from '.botpress'

const MAX_TIME_IN_STAGING = 7 * 24 * 60 * 60 * 1000 // 1 week in milliseconds
const MAX_TIME_BLOCKED = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
const STAGING_ISSUE_COMMENT = 'BugBuster bot detected that this issue has been left in staging for over a week'
const BLOCKED_ISSUE_COMMENT = 'BugBuster bot detected that this issue has been blocked for more than 30 days'

export const handleCheckIssuesStatus: bp.EventHandlers['timeToCheckIssuesStatus'] = async (props) => {
  const { logger, client, ctx } = props

  const botpress = await BotpressApi.create(props)
  const _handleError = (context: string) => handleError(context, logger, botpress)

  logger.info("Validating issues' statuses...")

  const teams = await listTeams(client, ctx.botId).catch(_handleError('trying to list teams'))
  if (!teams.success || !teams.result) {
    logger.error(teams.message)
    return
  }

  const linear = await utils.linear.LinearApi.create()
  const issues = await linear.listIssues({ teamKeys: teams.result })

  const executer = new StatusCheckExecutor(issues.issues, logger, linear)

  const {
    state: {
      payload: { issues: stagingIssues },
    },
  } = await props.client.getOrSetState({
    id: ctx.botId,
    name: 'issuesInStaging',
    payload: { issues: [] },
    type: 'bot',
  })

  const updatedStagingIssues = await executer.executeStatusCheck(
    stagingIssues,
    MAX_TIME_IN_STAGING,
    'in staging for over a week',
    'STAGING',
    STAGING_ISSUE_COMMENT
  )

  await props.client.setState({
    id: ctx.botId,
    name: 'issuesInStaging',
    payload: { issues: updatedStagingIssues },
    type: 'bot',
  })

  const {
    state: {
      payload: { issues: blockedIssues },
    },
  } = await props.client.getOrSetState({
    id: ctx.botId,
    name: 'blockedIssues',
    payload: { issues: [] },
    type: 'bot',
  })

  const updatedBlockedIssues = await executer.executeStatusCheck(
    blockedIssues,
    MAX_TIME_BLOCKED,
    'blocked for more than 30 days',
    'BLOCKED',
    BLOCKED_ISSUE_COMMENT
  )

  await props.client.setState({
    id: ctx.botId,
    name: 'blockedIssues',
    payload: { issues: updatedBlockedIssues },
    type: 'bot',
  })

  logger.info("Finished validating issues' statuses...")
}
