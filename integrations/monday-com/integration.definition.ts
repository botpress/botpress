import { IntegrationDefinition, z } from '@botpress/sdk'
import { configurationSchema, createItemSchema, syncItemsSchema } from 'src/misc/custom-schemas'

export default new IntegrationDefinition({
  name: 'monday-com',
  title: 'Monday.com',
  description: 'Manage items in Monday.com boards.',
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  states: {
    webhooks: {
      type: 'integration',
      schema: z.object({
        registered: z
          .array(
            z.object({
              name: z.enum(['create_item', 'item_deleted']),
              boardId: z.string(),
              webhookId: z.string(),
            })
          )
          .title('Registered Webhooks')
          .describe('Webhooks in the Monday.com platform which have been auto-registered by the Botpress integration.'),
      }),
    },
  },
  actions: {
    createItem: {
      title: 'Create Item',
      description: 'Create a new item.',
      input: { schema: createItemSchema },
      output: { schema: z.object({}) },
    },
    syncItems: {
      title: 'Sync Items',
      description: 'Retrieve items from a Monday.com board and store them in a Botpress table.',
      input: { schema: syncItemsSchema },
      output: { schema: z.object({}) },
    },
  },
  configuration: {
    schema: configurationSchema,
  },
})
