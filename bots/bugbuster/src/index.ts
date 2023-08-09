import * as botpress from '.botpress'

const github = new botpress.github.Github()
const linear = new botpress.linear.Linear()

const bot = new botpress.Bot({
  integrations: {
    github,
    linear,
  },
  states: {},
  events: {},
})

bot.event(async ({ event, client, ctx }) => {
  if (event.type !== 'github:issueOpened') {
    return
  }

  const githubIssue = event.payload

  console.info('Received GitHub issue', githubIssue)

  const { output } = await client.callAction({
    type: 'linear:createIssue',
    input: {
      title: githubIssue.title,
      description: githubIssue.content ?? 'No content...',
      teamName: 'Cloud Services',
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
})

export default bot
