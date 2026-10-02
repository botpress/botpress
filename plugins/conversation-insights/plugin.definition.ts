import { PluginDefinition, z } from '@botpress/sdk'

export default new PluginDefinition({
  name: 'conversation-insights',
  version: '0.6.2',
  configuration: {
    schema: z.object({
      aiEnabled: z.boolean().default(true).describe('Set to true to enable title, summary and sentiment ai generation'),
      aiGenerationInterval: z
        .number()
        .optional()
        .title('AI Generation Interval')
        .describe('Interval in minutes between AI insight generations'),
    }),
  },
  conversation: {
    tags: {
      title: { title: 'Title', description: 'The title of the conversation.' },
      summary: {
        title: 'Summary',
        description: 'A summary of the current conversation.',
      },
      message_count: {
        title: 'Message count',
        description: 'The count of messages sent in the conversation by both the bot and user(s). Type: int',
      },
      participant_count: {
        title: 'Participant count',
        description: 'The count of users having participated in the conversation, including the bot. Type: int',
      },
      sentiment: {
        title: 'Sentiment',
        description: 'The sentiment that best describes the conversation. Type: enum Sentiments',
      },
      isDirty: {
        title: 'Is Dirty',
        description:
          "Indicates whether a conversation's AI insight has been updated since the last message. Type: boolean",
      },
      insightStatus: {
        title: 'Insight status',
        description:
          "Set when generating the AI insight failed. 'failed': the next run tries again. 'failed-permanently': only a new message makes the conversation eligible again. Absent otherwise. Type: enum 'failed' | 'failed-permanently'",
      },
      insightFailureCount: {
        title: 'Insight failure count',
        description:
          'How many runs failed to generate the AI insight since the last message or successful generation, not counting runs where Cognitive could not be reached. Type: int',
      },
    },
  },
  events: {
    updateAiInsight: {
      schema: z.object({}),
    },
  },
  workflows: { updateAllConversations: { input: { schema: z.object({}) }, output: { schema: z.object({}) } } },
})
