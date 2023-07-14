import type { Client } from '@botpress/client'
import { Bot } from '@botpress/sdk'
import type { z } from 'zod'
import * as schemas from './schemas'
import { Github, Linear } from '.botpress'

const github = new Github()
const linear = new Linear()

const bot = new Bot({
  integrations: [github, linear],
  configuration: {
    schema: {},
  },
  states: {},
  events: {},
})

const createLinearIssue = async (
  client: Client,
  issue: z.infer<typeof schemas.linearCreateIssueInput>
): Promise<z.infer<typeof schemas.linearCreateIssueOutput>> => {
  const { output } = await client.callAction({
    type: 'linear:createIssue',
    input: issue,
  })

  const parseResult = schemas.linearCreateIssueOutput.safeParse(output)
  if (!parseResult.success) {
    throw new Error(`Invalid output: ${parseResult.error}`)
  }

  return parseResult.data
}

bot.event('', async ({ event, client, ctx }) => {
  const { type, payload } = event
  if (type !== schemas.githubIssueOpenedType) {
    return
  }

  const parseResult = schemas.githubIssueOpened.safeParse(payload)
  if (!parseResult.success) {
    throw new Error(`Invalid payload: ${parseResult.error}`)
  }

  const { data: githubIssue } = parseResult

  console.info('Received GitHub issue', githubIssue)

  const { issue } = await createLinearIssue(client, {
    title: githubIssue.title,
    description: githubIssue.content ?? 'No content...',
    teamName: 'Cloud Services',
  })

  const { conversation } = await client.getOrCreateConversation({
    channel: 'issue',
    tags: {
      ['linear:id']: issue.id,
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
