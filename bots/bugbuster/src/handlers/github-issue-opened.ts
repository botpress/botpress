import * as boot from '../bootstrap'
import * as bp from '.botpress'

export const handleGithubIssueOpened: bp.EventHandlers['github:issueOpened'] = async (props): Promise<void> => {
  const githubIssue = props.event.payload

  props.logger.info('Received GitHub issue', githubIssue)

  const { linear, botpress } = await boot.bootstrap(props)

  const _handleError =
    (context: string) =>
    (thrown: unknown): Promise<never> =>
      botpress.handleError({ context, conversationId: undefined }, thrown)

  const githubLabel = await linear
    .findLabel({ name: 'github', parentName: 'origin' })
    .catch(_handleError('trying to find the origin/github label in Linear'))

  if (!githubLabel) {
    props.logger.error('Label origin/github not found in engineering team')
  }

  const linearResponse = await linear.client
    .createIssue({
      teamId: linear.teams.ENG.id,
      stateId: linear.states.ENG.TRIAGE.id,
      title: githubIssue.issue.name,
      description: githubIssue.issue.body,
      labelIds: githubLabel ? [githubLabel.id] : [],
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
