import { RuntimeError } from '@botpress/sdk'
import { ApiKeySession, ProfilesApi } from 'klaviyo-api'
import * as bp from '.botpress'

export const createKlaviyoSession = (apiKey: string): ApiKeySession => {
  if (!apiKey) {
    throw new RuntimeError('API Key is required for Klaviyo integration')
  }

  return new ApiKeySession(apiKey)
}

export const getApiKey = (ctx: bp.Context): string => {
  const { apiKey } = ctx.configuration

  if (!apiKey) {
    throw new RuntimeError('API Key is required for Klaviyo integration')
  }

  return apiKey
}

export const getProfilesApi = (ctx: bp.Context): ProfilesApi => {
  const apiKey = getApiKey(ctx)
  const session = createKlaviyoSession(apiKey)
  return new ProfilesApi(session)
}
