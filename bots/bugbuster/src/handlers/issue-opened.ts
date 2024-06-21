import { Handler } from './typings'

export const handleNewIssue: Handler<'github:issueOpened'> = async ({ client, ctx }, event): Promise<void> => {
  const githubIssue = event.payload

  console.info('Received GitHub issue', githubIssue)

  const { output } = await client.callAction({
    type: 'linear:createIssue',
    input: {
      title: githubIssue.title,
      description: githubIssue.content ?? 'No content...',
      teamName: 'Cloud Services',
      labels: ['origin/github'],
    },
  })

  const { issue } = output

  const { conversation } = await client.getOrCreateConversation({
    integrationName: 'linear',
    channel: 'issue',
    tags: {
      ['linear:id']: issue.id,
    },
  })

  const issueUrl = `https://github.com/${githubIssue.repositoryOwner}/${githubIssue.repositoryName}/issues/${githubIssue.number}`

  await client.createMessage({
    type: 'text',
    conversationId: conversation.id,
    userId: ctx.botId,
    tags: {},
    payload: {
      text: `Automatically created from GitHub issue: ${issueUrl}`,
    },
  })
}
