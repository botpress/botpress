import * as boot from '../bootstrap'
import * as bp from '.botpress'

const STAGING_ISSUE_COMMENT = 'BugBuster bot detected that this issue has been left in staging for over a week'
const MAX_TIME_IN_STAGING = 7 * 24 * 60 * 60 * 1000 // 1 week in milliseconds

export const handleTimeToCheckIssuesState: bp.EventHandlers['timeToCheckIssuesState'] = async (props) => {
  const { logger, client, ctx } = props
  const { botpress, teamsManager, linear, issueStateChecker } = boot.bootstrap(props)
  const _handleError =
    (context: string) =>
    (thrown: unknown): Promise<never> =>
      botpress.handleError({ context }, thrown)

  logger.info("Validating issues' states...")
  const teams = await teamsManager.listWatchedTeams().catch(_handleError('trying to list teams'))

  const {
    state: {
      payload: { issues: previousStagingIssues },
    },
  } = await client
    .getOrSetState({
      id: ctx.botId,
      name: 'issuesInStaging',
      payload: { issues: [] },
      type: 'bot',
    })
    .catch(_handleError('trying to get previous staging issues'))

  const issues = await linear.listIssues({ teamKeys: teams })
  const updatedStagingIssues = await issueStateChecker
    .getUpdatedIssuesOfState(previousStagingIssues, issues.issues, 'STAGING')
    .catch(_handleError('trying to get updated staging issues'))

  const problematicIssues = issueStateChecker.getProblematicIssues(updatedStagingIssues, MAX_TIME_IN_STAGING)

  for (const issue of problematicIssues) {
    const fullIssue = issues.issues.filter((fullIssue) => fullIssue.id === issue.id)[0]

    logger.warn(
      `Linear issue ${fullIssue ? `${fullIssue.identifier}` : `with ID ${issue.id}`} has been in staging for over a week.`
    )

    const commentResult = await linear.client
      .createComment({
        issueId: issue.id,
        body: STAGING_ISSUE_COMMENT,
      })
      .catch(_handleError('trying to comment an issue'))
    issue.commentId = commentResult.commentId
  }

  await props.client
    .setState({
      id: ctx.botId,
      name: 'issuesInStaging',
      payload: { issues: updatedStagingIssues },
      type: 'bot',
    })
    .catch(_handleError('trying to set the updated staging issues'))

  await issueStateChecker
    .resolveComments(previousStagingIssues, updatedStagingIssues)
    .catch(_handleError('trying to resolve comments'))

  logger.info("Finished validating issues' states...")
}
