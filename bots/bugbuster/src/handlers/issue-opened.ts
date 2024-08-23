import * as listener from '../listeners'
import { Handler } from './typings'

export const handleNewIssue: Handler<'github:issueOpened'> = async (props, event): Promise<void> => {
  const githubIssue = event.payload

  console.info('Received GitHub issue', githubIssue)

  const message = ['The following issue was just created in GitHub:', githubIssue.title, githubIssue.content].join('\n')

  await listener.notifyListeners(props, {
    type: 'text',
    payload: {
      text: message,
    },
  })
}
