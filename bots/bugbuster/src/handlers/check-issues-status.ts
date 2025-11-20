import { BotpressApi } from 'src/utils/botpress-utils'
import { handleError } from 'src/utils/error-handler'
import { Issue } from 'src/utils/graphql-queries'
import { LinearApi } from 'src/utils/linear-utils'
import * as utils from '../utils'
import { listTeams } from './teams-manager'
import * as bp from '.botpress'

const MAX_TIME_IN_STAGING = 7 * 24 * 60 * 60 * 1000 // 1 week in milliseconds
const STAGING_ISSUE_COMMENT = 'BugBuster bot detected that this issue has been left in staging for over a week'

type WatchedIssue = { id: string; sinceTimestamp: number; commentId?: string }

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

  const linear = await utils.linear.LinearApi.create()
  const issues = await linear.listIssues({ teamKeys: teams.result })
  const currentStagingIssueIds = _getIdsOfIssuesInStaging(issues.issues, linear)

  const updatedStagingIssues = _getUpdatedStagingIssues(stagingIssues, currentStagingIssueIds)

  for (const issue of updatedStagingIssues) {
    if (!_isIssueProblematic(issue)) {
      continue
    }

    const fullIssue = issues.issues.filter((fullIssue) => fullIssue.id === issue.id)[0]
    logger.warn(
      `Linear issue ${fullIssue ? `${fullIssue.identifier}` : `with ID ${issue.id}`} has been in staging for over a week.`
    )

    const result = await linear.client.createComment({
      issueId: issue.id,
      body: STAGING_ISSUE_COMMENT,
    })
    issue.commentId = result.commentId
  }
  await props.client.setState({
    id: ctx.botId,
    name: 'issuesInStaging',
    payload: { issues: updatedStagingIssues },
    type: 'bot',
  })

  await _resolveComments(stagingIssues, updatedStagingIssues, linear)
  logger.info("Finished validating issues' statuses...")
}

const _resolveComments = async (outdatedIssues: WatchedIssue[], newIssues: WatchedIssue[], linear: LinearApi) => {
  for (const issue of outdatedIssues) {
    if (!newIssues.some((newIssue) => newIssue.id === issue.id) && issue.commentId) {
      await linear.client.commentResolve(issue.commentId)
    }
  }
}

const _isIssueProblematic = (issue: WatchedIssue): boolean => {
  return !issue.commentId && !_isDateValid(issue.sinceTimestamp, new Date().getTime(), MAX_TIME_IN_STAGING)
}

const _isDateValid = (initialTimestamp: number, currentTimestamp: number, maxIntervalMs: number) => {
  return currentTimestamp - initialTimestamp <= maxIntervalMs
}

const _getUpdatedStagingIssues = (stagingIssues: WatchedIssue[], currentStagingIssueIds: string[]) => {
  const newIssues: WatchedIssue[] = []

  for (const issue of stagingIssues) {
    if (currentStagingIssueIds.includes(issue.id)) {
      newIssues.push(issue)
    }
  }

  for (const id of currentStagingIssueIds) {
    if (!newIssues.some((issue) => issue.id === id)) {
      newIssues.push({ id, sinceTimestamp: new Date().getTime() })
    }
  }

  return newIssues
}

const _getIdsOfIssuesInStaging = (issues: Issue[], linear: LinearApi): string[] => {
  const ids: string[] = []

  for (const issue of issues) {
    const issueState = linear.issueStatus(issue)
    if (issueState === 'STAGING') {
      ids.push(issue.id)
    }
  }
  return ids
}
