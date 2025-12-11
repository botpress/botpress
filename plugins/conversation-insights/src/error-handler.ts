import { BotLogger } from '@botpress/sdk'

export const handleError =
  (props: { context: string; logger: BotLogger }) =>
  async (thrown: unknown): Promise<undefined> => {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    const message = `An error occured in the conversation-insights plugin while ${props.context}: ${error.message}`
    props.logger.error(message)
  }
