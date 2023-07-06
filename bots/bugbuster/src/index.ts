import type { Client } from '@botpress/client'
import { Bot } from '@botpress/sdk'
import type { z } from 'zod'
import * as schemas from './schemas'
import * as botpress from '.botpress' /** uncomment to get generated code */

// oauth linear
// https://linear.app/oauth/authorize?client_id=${config.linearClientId}&redirect_uri=${webhookPrefix}/oauth&response_type=code&prompt=consent&actor=application&state=${webhookId}&scope=read,write,issues:create,comments:create,admin

const github = new botpress.Github({ enabled: false })
const linear = new botpress.Linear({ enabled: false })

const bot = new Bot({
  integrations: [github, linear],
  configuration: {
    schema: {},
  },
  states: {},
  events: {},
})

// eslint-disable-next-line unused-imports/no-unused-vars
const createLinearIssue = async (client: Client, issue: z.infer<typeof schemas.linearCreateIssueInput>) => {
  await client.callAction({
    type: 'linear:createIssue',
    input: issue,
  })
}

bot.event('', async ({ event, client }) => {
  console.info('event', event)

  const { type, payload } = event
  if (type !== schemas.githubIssueOpenedType) {
    return
  }

  const parseResult = schemas.githubIssueOpened.safeParse(payload)
  if (!parseResult.success) {
    throw new Error(`Invalid payload: ${parseResult.error}`)
  }

  const { data: openedIssue } = parseResult

  console.info('New issue opened', openedIssue)

  await createLinearIssue(client, {
    title: openedIssue.title,
    description: openedIssue.content ?? 'No content...',
    teamName: 'Cloud Services',
  })

  // TODO: create a comment on the linear issue with the link to the github issue
})

export default bot
