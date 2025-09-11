import { RuntimeError } from '@botpress/sdk'
import { ApiKeySession, AccountsApi } from 'klaviyo-api'
import * as bp from '.botpress'

// Klaviyo API key validation test
const validateKlaviyoApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const session = new ApiKeySession(apiKey)
    const accountsApi = new AccountsApi(session)

    // Test the API key by making a simple request to get account info
    // TODO: Change this to a more formal validation... this likely isnt best practices
    await accountsApi.getAccounts()
    return true
  } catch (error) {
    return false
  }
}

export const register: bp.IntegrationProps['register'] = async ({ ctx }) => {
  // TODO: built oauth
  if (ctx.configurationType !== 'manual') {
    return
  }

  const { apiKey } = ctx.configuration

  if (!apiKey) {
    throw new RuntimeError('API Key is required for manual configuration')
  }

  // Validate the API key by making a test request
  const isValidApiKey = await validateKlaviyoApiKey(apiKey)

  if (!isValidApiKey) {
    throw new RuntimeError('Invalid API Key. Please check your Klaviyo Private API Key and try again.')
  }
}

export const unregister: bp.IntegrationProps['unregister'] = async () => {
  // TODO: Add ability to unregister (required by BP typing)
}
