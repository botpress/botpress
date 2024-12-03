import { z, IntegrationDefinitionProps } from '@botpress/sdk'
import { FreshchatConfigurationSchema } from './schemas'

export { channels } from './channels'

export const events = {} satisfies IntegrationDefinitionProps['events']

export const configuration = {
  schema: FreshchatConfigurationSchema,
} satisfies IntegrationDefinitionProps['configuration']

export const states = {
  freshchat: {
    type: 'integration',
    schema: z.object({
      channelId: z.string().title('Channel Id').describe('Id from the channel topic'),
    }),
  },
} satisfies IntegrationDefinitionProps['states']

export const user = {
  tags: {
    id: { description: 'Freshchat User Id', title: 'Freshchat User Id' },
  },
} satisfies IntegrationDefinitionProps['user']
