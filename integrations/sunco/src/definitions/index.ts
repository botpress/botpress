import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export const events = {
  conversationCreated: {
    title: 'Conversation Created',
    description: 'This event occurs when a conversation is created',
    schema: z.object({
      userId: z.string().title('User ID').describe('The Botpress user ID'),
      conversationId: z.string().title('Conversation ID').describe('The Botpress conversation ID'),
    }),
    ui: {},
  },
} satisfies IntegrationDefinitionProps['events']
