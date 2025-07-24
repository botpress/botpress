import * as lin from '@linear/sdk'
import * as genenv from '../../.genenv'
import * as bpApi from '../bp-api-utils'
import * as linApi from '../linear-api-utils'
import * as bp from '.botpress'

export const handleGithubIssueOpened: bp.EventHandlers['github:issueOpened'] = async (props): Promise<void> => {
  const githubIssue = props.event.payload

  props.logger.info('Received GitHub issue', githubIssue)

  let linearResponse: lin.IssuePayload | undefined = undefined
  try {
    const linear = await linApi.LinearApi.create(genenv.BUGBUSTER_LINEAR_API_KEY)

    const githubLabel = await linear.findLabel('github', 'origin')
    if (!githubLabel) {
      props.logger.error('Label origin/github not found in engineering team')
    }

    linearResponse = await linear.client.createIssue({
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
  } catch (thrown) {
    props.logger.error('Failed to create Linear issue', thrown)
  }

  const linearIssue = await linearResponse?.issue

  const message = [
    'The following issue was just created in GitHub:',
    githubIssue.issue.name,
    githubIssue.issue.body,
    `Linear issue: ${linearIssue?.identifier}`,
  ].join('\n')

  const botpress = await bpApi.BotpressApi.create(props)
  await botpress.notifyListeners({
    type: 'text',
    payload: {
      text: message,
    },
  })
}
