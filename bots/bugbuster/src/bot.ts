import { z } from '@botpress/sdk'
import * as bp from '.botpress'

const github = new bp.github.Github()
const slack = new bp.slack.Slack()

type AsyncFunction = (...args: any[]) => Promise<any>

export type Bot = typeof bot
export type EventHandler = Parameters<Bot['event']>[0]
export type EventHandlerProps = Parameters<EventHandler>[0]
export type MessageHandler = Parameters<Bot['message']>[0]
export type MessageHandlerProps = Parameters<MessageHandler>[0]

export type Client = EventHandlerProps['client']
export type ClientOperation = keyof {
  [K in keyof Client as Client[K] extends AsyncFunction ? K : never]: null
}
export type ClientInputs = {
  [K in ClientOperation]: Parameters<Client[K]>[0]
}
export type ClientOutputs = {
  [K in ClientOperation]: Awaited<ReturnType<Client[K]>>
}

export type BotEvents = {
  [K in EventHandlerProps['event']['type']]: Extract<EventHandlerProps['event'], { type: K }>
}

export type BotListeners = z.infer<typeof listenersSchema>

const listenersSchema = z.object({
  conversationIds: z.array(z.string()),
})

const BOT_CONFIGURATION_SCHEMA = z.object({
  githubRepoToWatch: z.string().title('GitHub Repository to Watch').describe('The repository to watch for issues'),
})

export type BotConfiguration = z.infer<typeof BOT_CONFIGURATION_SCHEMA>

export const bot = new bp.Bot({
  integrations: {
    github,
    slack,
  },
  states: {
    listeners: {
      type: 'bot',
      schema: listenersSchema,
    },
  },
  configuration: {
    schema: BOT_CONFIGURATION_SCHEMA,
  },
  events: {
    syncIssuesRequest: {
      schema: z.object({}),
    },
  },
  recurringEvents: {
    fetchIssues: {
      type: 'syncIssuesRequest',
      payload: {},
      schedule: { cron: '0 0/6 * * *' }, // every 6 hours
    },
  },
})
