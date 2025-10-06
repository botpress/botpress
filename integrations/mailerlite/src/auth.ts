import { RuntimeError } from '@botpress/client'
import * as bp from '.botpress'

export const getAccessToken = async ({ ctx }: { client: bp.Client; ctx: bp.Context }) => {
  const { APIKey } = ctx.configuration

  if (!APIKey) {
    throw new RuntimeError('Access token not found in saved credentials')
  }
  return APIKey
}
