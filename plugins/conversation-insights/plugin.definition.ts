import { PluginDefinition, z } from '@botpress/sdk'

const UPDATE_CRON = '* * * * *' //every minute

export default new PluginDefinition({
  name: 'nathaniel-conversation-insights',
  version: '0.1.1',
  conversation: {
    tags: {
      title: { title: 'Title', description: 'The title of the conversation. To update, [TODO: explain update logic]' },
      summary: {
        title: 'Summary',
        description: 'A summary of the current conversation. To update, [TODO: explain update logic] ',
      },
      message_count: {
        title: 'Message count',
        description: 'The count of messages sent in the conversation by both the bot and user(s). Type: int',
      },
      participant_count: {
        title: 'Participant count',
        description: 'The count of users having participated in the conversation, including the bot. Type: int',
      },
      cost: { title: 'Conversation cost', description: 'The total AI spend cost of the conversation. Type: float' },
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
