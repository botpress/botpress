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
    avatar_hash: {},
    status_text: {},
    status_emoji: {},
    real_name: {},
    display_name: {},
    real_name_normalized: {},
    display_name_normalized: {},
    email: {},
    image_24: {},
    image_32: {},
    image_48: {},
    image_72: {},
    image_192: {},
    image_512: {},
    team: {},
  },
  creation: { enabled: true, requiredTags: ['id'] },
} satisfies IntegrationDefinitionProps['user']
