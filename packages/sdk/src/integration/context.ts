import { z } from 'zod'

export const integrationOperationSchema = z.enum([
  'webhook_received',
  'message_created',
  'action_triggered',
  'register',
  'unregister',
  'ping',
  'create_user',
  'create_conversation',
])

export type IntegrationOperation = z.infer<typeof integrationOperationSchema>

export type IntegrationContext<Configuration = any> = {
  botId: string
  botUserId: string
  integrationId: string
  webhookId: string
  operation: IntegrationOperation
  configuration: Configuration
}
