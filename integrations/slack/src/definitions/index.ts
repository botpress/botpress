import { IntegrationDefinitionProps } from '@botpress/sdk'
import { z } from 'zod'

export { actions } from './actions'
export { events } from './events'
export { channels } from './channels'

export const configuration = {
  identifier: {
    linkTemplateScript: 'linkTemplate.vrl',
  },
  schema: z.object({
    botToken: z.string().optional(), // TODO revert once the multiple configuration is available
    signingSecret: z.string().optional(), // TODO revert once the multiple configuration is available
  }),
} satisfies IntegrationDefinitionProps['configuration']

export const states = {
  configuration: {
    type: 'integration',
    schema: z.object({
      botUserId: z.string().optional(),
    }),
  },
  sync: {
    type: 'integration',
    schema: z.object({
      usersLastSyncTs: z.number().optional(),
    }),
  },
  credentials: {
    type: 'integration',
    schema: z.object({
      accessToken: z.string(),
    }),
  },
} satisfies IntegrationDefinitionProps['states']

export const user = {
  tags: {
    id: {},
    tz: {},
    is_bot: {},
    is_admin: {},
    title: {},
    phone: {},
    email: {},
    real_name: {},
    display_name: {},
    real_name_normalized: {},
    display_name_normalized: {},
    avatar_hash: {},
    status_text: {},
    status_emoji: {},
    image_24: {},
    image_48: {},
    image_192: {},
    image_512: {},
    image_1024: {},
    team: {},
  } as const,
  creation: { enabled: true, requiredTags: ['id'] },
} as const satisfies IntegrationDefinitionProps['user']
