import { z } from '@bpinternal/zui'
import { botIdHeader, configurationHeader, operationHeader, typeHeader } from '../const'

export const botOperationSchema = z.enum(['event_received', 'register', 'unregister', 'ping', 'action_triggered'])

export type BotOperation = z.infer<typeof botOperationSchema>

export type BotContext = {
  botId: string
  type: string
  operation: BotOperation
  configuration: {
    payload: string
  }
}

export const extractContext = (headers: Record<string, string | undefined>): BotContext => {
  const botId = headers[botIdHeader]
  const base64Configuration = headers[configurationHeader]
  const type = headers[typeHeader]
  const operation = botOperationSchema.parse(headers[operationHeader])

  if (!botId) {
    throw new Error('Missing bot headers')
  }

  if (!type) {
    throw new Error('Missing type headers')
  }

  if (!base64Configuration) {
    throw new Error('Missing configuration headers')
  }

  if (!operation) {
    throw new Error('Missing operation headers')
  }

  return {
    botId,
    operation,
    type,
    configuration: base64Configuration ? JSON.parse(Buffer.from(base64Configuration, 'base64').toString('utf-8')) : {},
  }
}
