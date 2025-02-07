import { z, IntegrationDefinitionProps } from '@botpress/sdk'
import type { ConversationReference } from 'botbuilder'

// type testing utils
type Is<A, B> = A extends B ? (B extends A ? true : false) : false
type Expect<_T extends true> = void

const channelAccount = z.object({
  id: z.string(),
  name: z.string(),
})

const convReference = z.object({
  activityId: z.string().optional().title('Activity ID').describe('The activity ID'),
  user: channelAccount.optional().title('User').describe('User account of the user conversing with the bot'),
  locale: z.string().optional().title('Locale').describe('The locale of the conversation'),
  bot: channelAccount.title('Bot').describe('Bot account of the bot'),
  conversation: z.any().title('Conversation').describe('Conversation reference'), // botbuilder typings are deceiving
  channelId: z.string().title('Channel ID').describe('The channel ID of the conversation'),
  serviceUrl: z
    .string()
    .title('Service URL')
    .describe('Service endpoint where the operations concerning the conversation are performed'),
})

const _convStateSchema = convReference.partial()
type ConvStateSchema = z.infer<typeof _convStateSchema>

// this builds only if the state schema is the same type as ConversationReference from 'botbuilder'
type A = ConvStateSchema
type B = Partial<ConversationReference>
type _Test = Expect<Is<A, B>>

export const states = {
  conversation: {
    type: 'conversation',
    schema: convReference.partial(),
  },
} satisfies IntegrationDefinitionProps['states']
