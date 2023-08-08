import * as botpress from '.botpress'

const github = new botpress.github.Github()
const linear = new botpress.linear.Linear()

type GITHUB_EVENT_TYPE = `github:${keyof botpress.github.events.Events}`

type LINEAR_CHANNELS = keyof botpress.linear.channels.Channels
type LINEAR_CONVERSATION_TAG = `linear:${keyof botpress.linear.channels.issue.ChannelIssue['conversation']['tags']}`

const GITHUB_ISSUE_OPENED_TYPE = 'github:issueOpened' satisfies GITHUB_EVENT_TYPE
const LINEAR_ISSUE_CHANNEL = 'issue' satisfies LINEAR_CHANNELS
const LINEAR_CONVERSATION_TAG_ID = 'linear:id' satisfies LINEAR_CONVERSATION_TAG

const bot = new botpress.Bot({
  integrations: {
    github,
    linear,
  },
  states: {},
  events: {},
})

bot.event(async ({ event, client, ctx }) => {
  const { type, payload } = event
  if (type !== GITHUB_ISSUE_OPENED_TYPE) {
    return
  }

  const githubIssue = payload

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
    channel: LINEAR_ISSUE_CHANNEL,
    tags: {
      [LINEAR_CONVERSATION_TAG_ID]: issue.id,
    },
    integrationName: 'linear',
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
