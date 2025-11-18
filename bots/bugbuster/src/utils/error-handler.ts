import { BotLogger, RuntimeError } from '@botpress/sdk'
import { BotpressApi } from './botpress-utils'

export const handleError =
  (context: string, logger: BotLogger, botpress: BotpressApi, conversationId: string) => async (thrown: unknown) => {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    const message = `An error occured while ${context}: ${error.message}`
    logger.error(message)
    if (conversationId) {
      await botpress.respondText(conversationId, message)
    }
    throw new RuntimeError(error.message)
  }
