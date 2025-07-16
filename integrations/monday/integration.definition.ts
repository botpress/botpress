import { IntegrationDefinition, z } from '@botpress/sdk'
import { configurationSchema, createItemSchema } from 'src/misc/custom-schemas'

export default new IntegrationDefinition({
  name: 'monday',
  title: 'Monday',
  description: 'Manage items in Monday boards.',
  version: '1.0.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  states: {},
  actions: {
    createItem: {
      title: 'Create Item',
      description: 'Create a new item.',
      input: { schema: createItemSchema },
      output: {
        schema: z.object({}),
      },
    },
  },
  configuration: {
    schema: configurationSchema,
  },
})
