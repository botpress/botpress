import { PluginDefinition, z } from '@botpress/sdk'

const UPDATE_CRON = '* * * * *' //every minute

export default new PluginDefinition({
  name: 'nathaniel-conversation-insights',
  version: '0.1.0',
  conversation: {
    tags: {
      title: { title: 'Title', description: 'The title of the conversation' },
      summary: { title: 'Summary', description: 'A summary of the current conversation. To update, ======TODO======' },
      message_count: {
        title: 'Message count',
        description: 'The count of messages sent in the conversation by both the bot and user(s). Type: int',
      },
      participant_count: {
        title: 'Participant count',
        description: 'The count of users having participated in the conversation. Includes the bot',
      },
      cost: { title: 'Conversation cost', description: 'The total AI spend cost of the conversation' },
      topics: { title: 'Topics', description: 'Topic tags for the conversation' },
    },
  },
  states: {
    participants: { schema: z.object({ ids: z.array(z.string()) }), type: 'conversation' },
    unreadMessages: { schema: z.object({ ids: z.array(z.string()) }), type: 'conversation' },
  },
  events: { updateTitleAndSummary: { schema: z.object({}) } },
  recurringEvents: {
    updateTitleAndSummaryRecurring: { type: 'updateTitleAndSummary', payload: {}, schedule: { cron: UPDATE_CRON } },
  },
})
