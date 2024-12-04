import { z } from '@bpinternal/zui'
import {
  botIdHeader,
  botUserIdHeader,
  configurationHeader,
  configurationTypeHeader,
  integrationIdHeader,
  operationHeader,
  webhookIdHeader,
} from '../../const'
import { IntegrationContext } from './types'

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

export const extractContext = (headers: Record<string, string | undefined>): IntegrationContext => {
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
  }
}
