import * as genenv from '../../.genenv'
import * as utils from '../utils'
import * as bp from '.botpress'

export const handleGithubIssueOpened: bp.EventHandlers['github:issueOpened'] = async (props): Promise<void> => {
  const githubIssue = props.event.payload

  props.logger.info('Received GitHub issue', githubIssue)

  const linear = await utils.linear.LinearApi.create(genenv.BUGBUSTER_LINEAR_API_KEY)

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

  const linearIssue = await linearResponse?.issue

  const message = [
    'The following issue was just created in GitHub:',
    githubIssue.issue.name,
    githubIssue.issue.body,
    `Linear issue: ${linearIssue?.identifier}`,
  ].join('\n')

  const botpress = await utils.botpress.BotpressApi.create(props)
  await botpress.notifyListeners({
    type: 'text',
    payload: {
      text: message,
    },
  })
}
