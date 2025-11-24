import { BotLogger, RuntimeError } from '@botpress/sdk'
import { BotpressApi } from './botpress-utils'

export type ErrorHandlerProps = {
  context: string
  logger: BotLogger
  botpress: BotpressApi
  conversationId?: string
}

export const handleError = (props: ErrorHandlerProps) => async (thrown: unknown) => {
  const error = thrown instanceof Error ? thrown : new Error(String(thrown))
  const message = `An error occured while ${props.context}: ${error.message}`
  props.logger.error(message)
  if (props.conversationId) {
    await props.botpress.respondText(props.conversationId, message)
  }
  throw new RuntimeError(error.message)
}
