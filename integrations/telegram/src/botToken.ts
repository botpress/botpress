import { RuntimeError } from '@botpress/sdk'
import * as bp from '.botpress'

export const getStoredBotToken = async (
  client: bp.Client,
  integrationId: string,
  legacyToken?: string
): Promise<string> => {
  const stateResult = await client
    .getState({ type: 'integration', name: 'credentials', id: integrationId })
    .catch(() => null)

  const botToken = stateResult?.state.payload.botToken ?? legacyToken
  if (typeof botToken !== 'string' || botToken.trim().length === 0) {
    throw new RuntimeError('Bot token is missing or invalid. Please complete the wizard setup again.')
  }

  return botToken
}
