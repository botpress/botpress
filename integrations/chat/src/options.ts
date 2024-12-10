import { z } from '@botpress/sdk'
import { EncryptionMode } from './auth-key'
import { logger } from './logger'
import { ActionArgs, HandlerProps, MessageArgs } from './types'
import * as bp from '.botpress'

const DEFAULT_FID_STORE_CONFIG: FidStoreConfig = { strategy: 'in-memory' }
type FidStoreConfig = z.infer<typeof fidStoreConfigSchema>

const tableSchema = z.object({
  tableName: z.string(),
  indexName: z.string(),
  partitionKey: z.string(),
  sortKey: z.string(),
  indexSortKey: z.string(),
})

const fidStoreConfigSchema = z.union([
  z.object({
    strategy: z.literal('in-memory'),
  }),
  z.object({
    strategy: z.literal('dynamo-db'),
    endpoint: z.string().optional(),
    region: z.string().optional(),
    accessKeyId: z.string(),
    secretAccessKey: z.string(),
    conversationTable: tableSchema,
    userTable: tableSchema,
  }),
])

type JsonSafeParseResult<T> = { success: true; data: T } | { success: false; err: Error }
const jsonSafeParse = <T = unknown>(str: string): JsonSafeParseResult<T> => {
  try {
    const data = JSON.parse(str)
    return { success: true, data }
  } catch (thrown) {
    const err = thrown instanceof Error ? thrown : new Error(String(thrown))
    return { success: false, err }
  }
}

const getFidStoreConfig = (b64Config: string | undefined): FidStoreConfig => {
  const warningMessage = 'falling back on in-memory chat id store. This will break if used in production.'
  if (!b64Config) {
    logger.warn(`FID_STORE_CONFIG secret is unset; ${warningMessage}`)
    return DEFAULT_FID_STORE_CONFIG
  }

  const fidStoreConfigDecoded = Buffer.from(b64Config, 'base64').toString()

  const jsonParseResult = jsonSafeParse(fidStoreConfigDecoded)
  if (!jsonParseResult.success) {
    logger.warn(`FID_STORE_CONFIG should be a base64 encoded JSON string; ${warningMessage}`)
    return DEFAULT_FID_STORE_CONFIG
  }

  const zodParseResult = fidStoreConfigSchema.safeParse(jsonParseResult.data)
  if (!zodParseResult.success) {
    logger.warn(`FID_STORE_CONFIG is invalid; ${warningMessage}`)
    return DEFAULT_FID_STORE_CONFIG
  }

  return zodParseResult.data
}

const signalUrl = bp.secrets.SIGNAL_URL
const signalSecret = bp.secrets.SIGNAL_SECRET
const fidStore = getFidStoreConfig(bp.secrets.FID_STORE_CONFIG)
logger.info('SIGNAL_URL', signalUrl)
logger.info('SIGNAL_SECRET', signalSecret)
logger.info('FID_STORE_CONFIG', fidStore)

export type Options = {
  botId: string

  signalUrl: string
  signalSecret?: string

  webhookUrl?: string
  webhookSecret?: string

  encryptionKey: string
  encryptionMode: EncryptionMode

  fidStore: FidStoreConfig
}

export const options = (args: MessageArgs | HandlerProps | ActionArgs): Options => {
  const { botId } = args.ctx
  const { encryptionKey: personalKey, webhookUrl, webhookSecret } = args.ctx.configuration
  const encryptionKey = personalKey ? personalKey : bp.secrets.AUTH_ENCRYPTION_KEY
  const encryptionMode = personalKey ? 'personal' : 'shared'

  return {
    botId,
    signalUrl,
    signalSecret,
    webhookUrl,
    webhookSecret,
    encryptionKey,
    encryptionMode,
    fidStore,
  }
}
