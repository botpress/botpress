import { IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import type { ConversationReference } from 'botbuilder'
import { z } from 'zod'

// type testing utils
type Is<A, B> = A extends B ? (B extends A ? true : false) : false
type Expect<_T extends true> = void

const channelAccount = z.object({
  id: z.string(),
  name: z.string(),
})

const convReference = z.object({
  activityId: z.string().optional(),
  user: channelAccount.optional(),
  locale: z.string().optional(),
  bot: channelAccount,
  conversation: z.any(), // botbuilder typings are deceiving
  channelId: z.string(),
  serviceUrl: z.string(),
})

const convStateSchema = convReference.partial()
type ConvStateSchema = z.infer<typeof convStateSchema>

// this builds only if the state schema is the same type as ConversationReference from 'botbuilder'
type A = ConvStateSchema
type B = Partial<ConversationReference>
type _Test = Expect<Is<A, B>>

export default new IntegrationDefinition({
  name: 'teams',
  version: '0.2.0',
  title: 'Microsoft Teams',
  description: 'This integration allows your bot to interact with Microsoft Teams.',
  icon: 'icon.svg',
  readme: 'readme.md',
  configuration: {
    schema: z.object({
      appId: z.string(),
      appPassword: z.string(),
    }),
  },
  channels: {
    channel: {
      messages: messages.defaults,
      tags: {
        messages: ['id'],
        conversations: ['id'],
      },
    },
  },
  tags: {
    users: ['id'],
  },
  actions: {},
  events: {},
  states: {
    conversation: {
      type: 'conversation',
      schema: convReference.partial(),
    },
  },
  secrets: [...sentryHelpers.COMMON_SECRET_NAMES],
})
