import { RuntimeError } from '@botpress/sdk'
import * as bp from '.botpress'

export const getStoredBotToken = async (client: bp.Client, integrationId: string): Promise<string> => {
  const { state } = await client.getState({ type: 'integration', name: 'credentials', id: integrationId }).catch(() => {
    throw new RuntimeError('Bot token not configured. Please complete the wizard setup first.')
  })
  return state.payload.botToken
}
