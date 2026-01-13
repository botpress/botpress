import * as boot from '../bootstrap'
import * as bp from '.botpress'

const TEAM_NAME_FOR_NEW_ISSUES = 'Engineering'

export const handleGithubIssueOpened: bp.EventHandlers['github:issueOpened'] = async (props): Promise<void> => {
  const githubIssue = props.event.payload

  props.logger.info('Received GitHub issue', githubIssue)

  const { botpress, linear } = boot.bootstrap(props)

  const _handleError =
    (context: string) =>
    (thrown: unknown): Promise<never> =>
      botpress.handleError({ context, conversationId: undefined }, thrown)

  const linearResponse = await props.client
    .callAction({
      type: 'linear:createIssue',
      input: {
        teamName: TEAM_NAME_FOR_NEW_ISSUES,
        description: githubIssue.issue.body,
        title: githubIssue.issue.name,
      },
    })
    .catch(_handleError('trying to create a Linear issue from the GitHub issue'))

  const comment = [
    'This issue was created from GitHub by BugBuster Bot.',
    '',
    `GitHub Issue: [${githubIssue.issue.name}](${githubIssue.issue.url})`,
  ].join('\n')

  await linear
    .createComment({
      body: comment,
      issueId: linearResponse.output.issue.id,
      botId: props.ctx.botId,
    })
    .catch(_handleError('trying to create a comment on the Linear issue created from GitHub'))
}
