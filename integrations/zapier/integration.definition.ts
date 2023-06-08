import { IntegrationDefinition } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { z } from 'zod'
import { TriggerSchema, EventSchema, ZapierTriggersStateName, ZapierTriggersStateSchema } from './src/types'

export default new IntegrationDefinition({
  name: 'zapier',
  version: '0.2.0',
  title: 'Zapier',
  description: 'This integration allows your bot to interact with Zapier.',
  icon: 'icon.svg',
  readme: 'readme.md',
  configuration: {
    schema: z.object({}),
  },
  channels: {},
  user: {
    tags: {
      id: {},
    },
  },
  states: {
    [ZapierTriggersStateName]: {
      type: 'integration',
      schema: ZapierTriggersStateSchema,
    },
  },
  events: {
    event: {
      schema: EventSchema,
      ui: { data: { title: 'Zapier Action Data', examples: ['{ "message": "hello, world" }'] } },
    },
  },
  actions: {
    trigger: {
      input: {
        schema: TriggerSchema,
        ui: { data: { title: 'Zap Trigger Data', examples: ['{ "message": "hello, world" }'] } },
      },
      output: {
        schema: z.object({}),
      },
    },
  },
  secrets: [...sentryHelpers.COMMON_SECRET_NAMES],
})
