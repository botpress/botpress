import { PluginDefinition, z } from '@botpress/sdk'

const UPDATE_CRON = '* * * * *' //every minute

export default new PluginDefinition({
  name: 'conversation-insights',
  version: '0.1.3',
  conversation: {
    tags: {
      title: { title: 'Title', description: 'The title of the conversation.' },
      summary: {
        title: 'Summary',
        description: 'A summary of the current conversation. ',
      },
      message_count: {
        title: 'Message count',
        description: 'The count of messages sent in the conversation by both the bot and user(s). Type: int',
      },
      participant_count: {
        title: 'Participant count',
        description: 'The count of users having participated in the conversation, including the bot. Type: int',
      },
      dirty: {
        title: 'Dirty',
        description: 'Signifies whether the conversation has had a new message since last refresh',
      },
    },
  },
  states: {
    participants: { schema: z.object({ ids: z.array(z.string()) }), type: 'conversation' },
  },
  events: { updateTitleAndSummary: { schema: z.object({}) } },
  recurringEvents: {
    updateTitleAndSummaryRecurring: { type: 'updateTitleAndSummary', payload: {}, schedule: { cron: UPDATE_CRON } },
  },
})
