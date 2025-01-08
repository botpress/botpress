import * as listener from '../listeners'
import * as bp from '.botpress'

export const handleNewIssue: bp.EventHandlers['github:issueOpened'] = async (props): Promise<void> => {
  const githubIssue = props.event.payload

  console.info('Received GitHub issue', githubIssue)

  const message = [
    'The following issue was just created in GitHub:',
    githubIssue.issue.name,
    githubIssue.issue.body,
  ].join('\n')

  await listener.notifyListeners(props, {
    type: 'text',
    payload: {
      text: message,
    },
  })
}
