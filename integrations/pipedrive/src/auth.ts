import { RuntimeError } from '@botpress/sdk'
import * as bp from '.botpress'
import { v2 } from 'pipedrive'

export const getApiConfig = async ({ ctx }: { ctx: bp.Context }) => {
  const apiKey = ctx.configuration.apiKey
  if (!apiKey) throw new RuntimeError('API key not found in configuration')
  return new v2.Configuration({ apiKey })
}