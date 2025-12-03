import * as types from 'src/types'
import * as boot from '../bootstrap'
import * as bp from '.botpress'

const STAGING_ISSUE_COMMENT = 'BugBuster bot detected that this issue has been in staging for over a week'
const BLOCKED_ISSUE_COMMENT = 'BugBuster bot detected that this issue has been blocked for over a month'

const statesToProcess: types.StateAttributes[] = [
  {
    stateKey: 'STAGING',
    maxTimeSinceLastUpdate: '-P1W',
    warningComment: STAGING_ISSUE_COMMENT,
    warningReason: 'in staging for over a week',
  },
  {
    stateKey: 'BLOCKED',
    maxTimeSinceLastUpdate: '-P1M',
    warningComment: BLOCKED_ISSUE_COMMENT,
    warningReason: 'blocked for over a month',
  },
]

export const handleTimeToCheckIssuesState: bp.EventHandlers['timeToCheckIssuesState'] = async (props) => {
  const { logger } = props
  const { botpress, teamsManager, issueStateChecker } = boot.bootstrap(props)
  const _handleError = (context: string) => (thrown: unknown) => botpress.handleError({ context }, thrown)

  logger.info("Validating issues' states...")

  const teams = await teamsManager.listWatchedTeams().catch(_handleError('trying to list teams'))

  for (const state of statesToProcess) {
    await issueStateChecker
      .processIssues({
        stateAttributes: state,
        teams,
      })
      .catch(_handleError("trying to check issues' states"))
  }

  logger.info("Finished validating issues' states...")
}
