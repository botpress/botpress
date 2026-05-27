import { RuntimeError } from '@botpress/sdk'
import * as bp from '.botpress'
import { v2, v1 } from 'pipedrive'

export const getApiConfig = async ({ ctx }: { ctx: bp.Context }): Promise<v2.Configuration> => {
  const apiKey = ctx.configuration.apiKey
  return new v2.Configuration({ apiKey })
}

export const validateCredentials = async ({ ctx }: { ctx: bp.Context }) => {
  try {
    const api = new v1.UsersApi(new v1.Configuration({ apiKey: ctx.configuration.apiKey }))
    await api.getCurrentUser()
  } catch {
    throw new RuntimeError('Invalid Pipedrive API key')
  }
}
