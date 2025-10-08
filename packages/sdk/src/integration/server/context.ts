import { z } from '@bpinternal/zui'
import {
  BOT_ID_HEADER,
  BOT_USER_ID_HEADER,
  CONFIGURATION_PAYLOAD_HEADER,
  CONFIGURATION_TYPE_HEADER,
  INTEGRATION_ALIAS_HEADER,
  INTEGRATION_ID_HEADER,
  OPERATION_TYPE_HEADER,
  WEBHOOK_ID_HEADER,
} from '../../consts'
import { throwError } from '../../utils/error-utils'
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

export const extractContext = (headers: Record<string, string | undefined>): IntegrationContext => ({
  botId: headers[BOT_ID_HEADER] || throwError('Missing bot header'),
  botUserId: headers[BOT_USER_ID_HEADER] || throwError('Missing bot user header'),
  integrationId: headers[INTEGRATION_ID_HEADER] || throwError('Missing integration header'),
  integrationAlias: headers[INTEGRATION_ALIAS_HEADER] || throwError('Missing integration alias header'),
  webhookId: headers[WEBHOOK_ID_HEADER] || throwError('Missing webhook header'),
  operation: headers[OPERATION_TYPE_HEADER] || throwError('Missing operation header'),
  configurationType: headers[CONFIGURATION_TYPE_HEADER] ?? null,
  configuration: JSON.parse(
    Buffer.from(headers[CONFIGURATION_PAYLOAD_HEADER] || throwError('Missing configuration header'), 'base64').toString(
      'utf-8'
    )
  ),
})
