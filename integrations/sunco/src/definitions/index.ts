import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export const events = {
  conversationStarted: {
    title: 'Conversation Started',
    description: 'This event occurs when a conversation is started',
    schema: z.object({
      userId: z.string().title('User ID').describe('The Botpress user ID'),
      conversationId: z.string().title('Conversation ID').describe('The Botpress conversation ID'),
    }),
    ui: {},
  },
} satisfies IntegrationDefinitionProps['events']
