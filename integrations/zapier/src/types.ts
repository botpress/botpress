import { z } from '@botpress/sdk'
import * as bp from '.botpress'

export type Client = bp.Client

export const TriggerSubscriberSchema = z.object({
  url: z.string(),
})

export type TriggerSubscriber = z.infer<typeof TriggerSubscriberSchema>

export const ZapierTriggersStateName = 'triggers' as const

export const ZapierTriggersStateSchema = z.object({
  subscribers: z.array(TriggerSubscriberSchema),
})

export type ZapierTriggersState = z.infer<typeof ZapierTriggersStateSchema>

export const IntegrationEventSchema = z.object({
  action: z.enum(['subscribe:triggers', 'unsubscribe:triggers']),
  url: z.string(),
})

export type IntegrationEvent = z.infer<typeof IntegrationEventSchema>

export const TriggerSchema = z.object({
  data: z.string().describe('The data you want to send to Zapier trigger. Can be any string including JSON.'),
  correlationId: z
    .string()
    .describe('Can be used to receive a response back from Zapier by listening for an `event.correlationId`')
    .optional(),
})

export type Trigger = z.infer<typeof TriggerSchema>

export type TriggerRequestBody = Trigger & {
  botId: string
}

export const EventSchema = z.object({
  data: z.string().describe('The data the Zapier action sent. Can be any string including JSON.'),
  correlationId: z
    .string()
    .describe('Can be used to correlate the response from Zapier when used with an `action.correlationId`')
    .optional(),
})

export type Event = z.infer<typeof EventSchema>
