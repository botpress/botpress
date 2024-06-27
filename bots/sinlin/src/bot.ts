import { z } from '@botpress/sdk'
import * as bp from '.botpress'

export type Bot = typeof bot
export type EventHandler = Parameters<Bot['event']>[0]
export type EventHandlerProps = Parameters<EventHandler>[0]
export type MessageHandler = Parameters<Bot['message']>[0]
export type MessageHandlerProps = Parameters<MessageHandler>[0]

export type IssueState = z.infer<typeof issueState>
const issueState = z.object({
  nextToken: z.string().optional(),
  tableCreated: z.boolean(),
})

export const bot = new bp.Bot({
  integrations: {
    linear: new bp.linear.Linear(),
    telegram: new bp.telegram.Telegram(),
  },
  configuration: {
    schema: z.object({}),
  },
  states: {
    issue: {
      type: 'bot',
      schema: z.object({
        nextToken: z.string().optional(),
        tableCreated: z.boolean(),
      }),
    },
  },
  events: {
    syncIssues: {
      schema: z.object({}),
    },
  },
  recurringEvents: {
    syncIssues: {
      type: 'syncIssues',
      payload: {},
      schedule: {
        cron: '* * * * *', // every minute
      },
    },
  },
})
