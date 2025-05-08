import { z } from '@bpinternal/zui'
import { botIdHeader, configurationHeader, operationHeader, typeHeader } from '../../consts'
import { BotContext } from './types'

const botOperationSchema = z.enum(['event_received', 'register', 'unregister', 'ping', 'action_triggered'])
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

  const configuration = _parseConfig(base64Configuration)
  return {
    botId,
    operation,
    type,
    configuration,
  }
}

const configurationSchema = z
  .object({
    payload: z.string(),
  })
  .strip()

/**
 * The bridge should send the configuration payload only as it does for integrations.
 * However, many bots that depend on this configuration header are already deployed and running.
 * Changing the header format would be highly breaking.
 * Therefore, we extract the header payload here.
 */
const _parseConfig = (base64ConfigHeader: string): object => {
  const configHeader: string = Buffer.from(base64ConfigHeader, 'base64').toString('utf-8')
  const parsedConfig = JSON.parse(configHeader)
  const validatedConfig = configurationSchema.parse(parsedConfig)
  const parsedConfigPayload = JSON.parse(validatedConfig.payload)
  return parsedConfigPayload
}
