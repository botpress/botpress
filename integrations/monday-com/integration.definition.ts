import { IntegrationDefinition, z } from '@botpress/sdk'
import {
  configurationSchema,
  createItemSchema,
  syncItemsSchema,
  registeredWebhooksSchema,
} from 'src/misc/custom-schemas'

export default new IntegrationDefinition({
  name: 'monday-com',
  title: 'Monday.com',
  description: 'Manage items in Monday.com boards.',
  version: '1.0.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  states: {
    webhooks: {
      type: 'integration',
      schema: registeredWebhooksSchema,
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
