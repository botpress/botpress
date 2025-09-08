import * as utils from '../utils'
import * as bp from '.botpress'

export const handleGithubIssueOpened: bp.EventHandlers['github:issueOpened'] = async (props): Promise<void> => {
  const githubIssue = props.event.payload

  props.logger.info('Received GitHub issue', githubIssue)

  const linear = await utils.linear.LinearApi.create()

  const githubLabel = await linear.findLabel({ name: 'github', parentName: 'origin' })
  if (!githubLabel) {
    props.logger.error('Label origin/github not found in engineering team')
  }

  const linearResponse = await linear.client.createIssue({
    teamId: linear.teams.ENG.id,
    stateId: linear.states.ENG.TRIAGE.id,
    title: githubIssue.issue.name,
    description: githubIssue.issue.body,
    labelIds: githubLabel ? [githubLabel.id] : [],
  })

  const comment = [
    'This issue was created from GitHub by BugBuster Bot.',
    '',
    `GitHub Issue: [${githubIssue.issue.name}](${githubIssue.issue.url})`,
  ].join('\n')

  await linear.client.createComment({
    issueId: linearResponse.issueId,
    body: comment,
  })
}
