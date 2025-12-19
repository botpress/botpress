import * as boot from '../bootstrap'
import * as bp from '.botpress'

const STATE_NAME_FOR_NEW_ISSUES = 'Triage'
const TEAM_KEY_FOR_NEW_ISSUES = 'ENG'

export const handleGithubIssueOpened: bp.EventHandlers['github:issueOpened'] = async (props): Promise<void> => {
  const githubIssue = props.event.payload

  props.logger.info('Received GitHub issue', githubIssue)

  const { linear, botpress } = boot.bootstrap(props)

  const _handleError =
    (context: string) =>
    (thrown: unknown): Promise<never> =>
      botpress.handleError({ context, conversationId: undefined }, thrown)

  const teamStates = await linear
    .findTeamStates(TEAM_KEY_FOR_NEW_ISSUES)
    .catch(_handleError('trying to get Linear team states'))

  if (!teamStates) {
    props.logger.error(`Error: Linear team '${TEAM_KEY_FOR_NEW_ISSUES}' not found.`)
    return
  }

  const state = teamStates.states.nodes.find((el) => el.name === STATE_NAME_FOR_NEW_ISSUES)

  if (!state) {
    props.logger.error(`Error: Linear state '${STATE_NAME_FOR_NEW_ISSUES}' not found.`)
    return
  }

  const linearResponse = await linear.client
    .createIssue({
      teamId: teamStates.id,
      stateId: state.id,
      title: githubIssue.issue.name,
      description: githubIssue.issue.body,
      labelIds: [],
    })
    .catch(_handleError('trying to create a Linear issue from the GitHub issue'))

  const comment = [
    'This issue was created from GitHub by BugBuster Bot.',
    '',
    `GitHub Issue: [${githubIssue.issue.name}](${githubIssue.issue.url})`,
  ].join('\n')

  await linear.client
    .createComment({
      issueId: linearResponse.issueId,
      body: comment,
    })
    .catch(_handleError('trying to create a comment on the Linear issue created from GitHub'))
}
