import { PluginDefinition, z } from '@botpress/sdk'
import llm from './bp_modules/llm'

export default new PluginDefinition({
  name: 'nathaniel-conversation-insights',
  version: '0.3.0',
  configuration: {
    schema: z.object({
      modelId: z.string().describe('The AI model id (ex: gpt-4.1-nano-2025-04-14)'),
      aiEnabled: z.boolean().default(true).describe('Set to true to enable title, summary and sentiment ai generation'),
    }),
  },
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
      sentiment: {
        title: 'Sentiment',
        description: 'The sentiment that best describes the conversation. Type: enum Sentiments',
      },
    },
  },
  events: {
    updateAiInsight: {
      schema: z.object({}),
    },
  },
  interfaces: {
    llm,
  },
})
