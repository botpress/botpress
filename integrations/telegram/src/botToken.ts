import { RuntimeError } from '@botpress/sdk'
import * as bp from '.botpress'

export const getStoredBotToken = async (
  client: bp.Client,
  integrationId: string,
  legacyToken?: string
): Promise<string> => {
  const stateResult = await client
    .getState({ type: 'integration', name: 'credentials', id: integrationId })
    .catch((thrown: unknown) => {
      const err = thrown instanceof Error ? thrown : new Error(String(thrown))
      if (err.message.toLowerCase().includes('not found')) {
        return null
      }
      throw err
    })

  const botToken = stateResult?.state.payload.botToken ?? legacyToken
  if (typeof botToken !== 'string' || botToken.trim().length === 0) {
    throw new RuntimeError('Bot token is missing or invalid. Please complete the wizard setup again.')
  }

  return botToken
}
