import * as boot from '../bootstrap'
import * as issueChecker from '../services/issue-state-checker'
import * as bp from '.botpress'

const STAGING_ISSUE_COMMENT = 'BugBuster bot detected that this issue has been left in staging for over a week'
const BLOCKED_ISSUE_COMMENT = 'BugBuster bot detected that this issue has been blocked for over a month'
const MAX_TIME_IN_STAGING = 7 * 24 * 60 * 60 * 1000 // 1 week in milliseconds
const MAX_TIME_BLOCKED = 30 * 24 * 60 * 1000 // 30 days in milliseconds

const stagingStaticProps: issueChecker.CheckIssuesStaticProps = {
  botStateName: 'issuesInStaging',
  state: 'STAGING',
  maxTimeInStateInMs: MAX_TIME_IN_STAGING,
  warningComment: STAGING_ISSUE_COMMENT,
}

const blockedStaticProps: issueChecker.CheckIssuesStaticProps = {
  botStateName: 'blockedIssues',
  state: 'BLOCKED',
  maxTimeInStateInMs: MAX_TIME_BLOCKED,
  warningComment: BLOCKED_ISSUE_COMMENT,
}

export const handleTimeToCheckIssuesState: bp.EventHandlers['timeToCheckIssuesState'] = async (props) => {
  const { logger } = props
  const { botpress, teamsManager, linear, issueStateChecker } = boot.bootstrap(props)
  const _handleError = (context: string) => (thrown: unknown) => botpress.handleError({ context }, thrown)

  logger.info("Validating issues' states...")
  const teams = await teamsManager.listWatchedTeams().catch(_handleError('trying to list teams'))

  const issues = await linear.listIssues({ teamKeys: teams }).catch(_handleError('trying list issues'))

  const failedIdsStaging = await issueStateChecker
    .checkIssues({ allIssues: issues.issues, ...stagingStaticProps })
    .catch(_handleError('checking for issues left in staging for over a week'))
  const failedIdsBlocked = await issueStateChecker
    .checkIssues({ allIssues: issues.issues, ...blockedStaticProps })
    .catch(_handleError('checking for issues blocked for over a month'))

  const logWarnings = (issueIds: string[], reason: string) => {
    for (const id of issueIds) {
      const fullIssue = issues.issues.filter((fullIssue) => fullIssue.id === id)[0]
      logger.warn(`Linear issue ${fullIssue ? `${fullIssue.identifier}` : `with ID ${id}`} has been ${reason}.`)
    }
  }

  logWarnings(failedIdsStaging, 'in staging for over a week')
  logWarnings(failedIdsBlocked, 'blocked for over a month')

  logger.info("Finished validating issues' states...")
}
