import { z } from '@bpinternal/zui'
import {
  BOT_ID_HEADER,
  CONFIGURATION_PAYLOAD_HEADER,
  OPERATION_TYPE_HEADER,
  OPERATION_SUBTYPE_HEADER,
} from '../../consts'
import { throwError } from '../../utils/error-utils'
import { BotContext } from './types'

const botOperationSchema = z.enum(['event_received', 'register', 'unregister', 'ping', 'action_triggered'])

export const extractContext = (headers: Record<string, string | undefined>): BotContext => ({
  botId: headers[BOT_ID_HEADER] || throwError('Missing bot id header'),
  operation: botOperationSchema.parse(headers[OPERATION_TYPE_HEADER]),
  type: headers[OPERATION_SUBTYPE_HEADER] || throwError('Missing type header'),
  configuration: JSON.parse(
    Buffer.from(headers[CONFIGURATION_PAYLOAD_HEADER] || throwError('Missing configuration header'), 'base64').toString(
      'utf-8'
    )
  ),
})
