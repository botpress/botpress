import { z } from '@bpinternal/zui'
import {
  botIdHeader,
  botUserIdHeader,
  configurationHeader,
  configurationTypeHeader,
  integrationIdHeader,
  operationHeader,
  webhookIdHeader,
} from '../const'
import { ValueOf } from '../type-utils'
import { BaseIntegration } from './generic'

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

type IntegrationContextConfig<TIntegration extends BaseIntegration> =
  | {
      configurationType: null
      configuration: TIntegration['configuration']
    }
  | ValueOf<{
      [TConfigType in keyof TIntegration['configurations']]: {
        configurationType: TConfigType
        configuration: TIntegration['configurations'][TConfigType]
      }
    }>

export type IntegrationContext<TIntegration extends BaseIntegration = BaseIntegration> = {
  botId: string
  botUserId: string
  integrationId: string
  webhookId: string
  operation: IntegrationOperation
} & IntegrationContextConfig<TIntegration>

export const extractContext = <TIntegration extends BaseIntegration>(
  headers: Record<string, string | undefined>
): IntegrationContext<TIntegration> => {
  const botId = headers[botIdHeader]
  const botUserId = headers[botUserIdHeader]
  const integrationId = headers[integrationIdHeader]
  const webhookId = headers[webhookIdHeader]
  const configurationType = headers[configurationTypeHeader]
  const base64Configuration = headers[configurationHeader]
  const operation = integrationOperationSchema.parse(headers[operationHeader])

  if (!botId) {
    throw new Error('Missing bot headers')
  }

  if (!botUserId) {
    throw new Error('Missing bot user headers')
  }

  if (!integrationId) {
    throw new Error('Missing integration headers')
  }

  if (!webhookId) {
    throw new Error('Missing webhook headers')
  }

  if (!base64Configuration) {
    throw new Error('Missing configuration headers')
  }

  if (!operation) {
    throw new Error('Missing operation headers')
  }

  return {
    botId,
    botUserId,
    integrationId,
    webhookId,
    operation,
    configurationType: configurationType ?? null,
    configuration: base64Configuration ? JSON.parse(Buffer.from(base64Configuration, 'base64').toString('utf-8')) : {},
  } as IntegrationContext<TIntegration>
}
