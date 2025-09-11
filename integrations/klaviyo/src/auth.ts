import { RuntimeError } from '@botpress/sdk'
import { ApiKeySession, ProfilesApi, AccountsApi } from 'klaviyo-api'
import * as bp from '.botpress'

/**
 * Creates a Klaviyo API key session for manual configuration
 */
export const createKlaviyoSession = (apiKey: string): ApiKeySession => {
  if (!apiKey) {
    throw new RuntimeError('API Key is required for Klaviyo integration')
  }

  return new ApiKeySession(apiKey)
}

/**
 * Gets the API key from the configuration context
 */
export const getApiKey = (ctx: bp.Context): string => {
  if (ctx.configurationType !== 'manual') {
    throw new RuntimeError('Manual configuration is required for Klaviyo integration')
  }

  const { apiKey } = ctx.configuration

  if (!apiKey) {
    throw new RuntimeError('API Key is required for Klaviyo integration')
  }

  return apiKey
}

/**
 * Creates a ProfilesApi instance with the configured API key
 */
export const getProfilesApi = (ctx: bp.Context): ProfilesApi => {
  const apiKey = getApiKey(ctx)
  const session = createKlaviyoSession(apiKey)
  return new ProfilesApi(session)
}

/**
 * Creates an AccountsApi instance with the configured API key
 */
export const getAccountsApi = (ctx: bp.Context): AccountsApi => {
  const apiKey = getApiKey(ctx)
  const session = createKlaviyoSession(apiKey)
  return new AccountsApi(session)
}
