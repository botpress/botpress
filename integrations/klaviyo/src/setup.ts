import { RuntimeError } from '@botpress/sdk'
import * as bp from '.botpress'

export const register: bp.IntegrationProps['register'] = async ({ ctx }) => {
  // TODO: built oauth
  if (ctx.configurationType !== 'manual') {
    return
  }

  const { apiKey } = ctx.configuration

  if (!apiKey) {
    throw new RuntimeError('API Key is required for manual configuration')
  }

  //TODO: Validate the API key by making a test request
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {
  // TODO: Add ability to unregister (required by BP typing)
}
