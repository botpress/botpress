import { RuntimeError } from '@botpress/sdk'
import * as bp from '.botpress'

export const getAccessToken = async ({ ctx }: { ctx: bp.Context }) => {
  let accessToken: string | undefined
  if (ctx.configurationType === 'manual') {
    accessToken = ctx.configuration.accessToken
  } else {
    // TODO: Add when OAuth config is implemented
  }

  if (!accessToken) {
    throw new RuntimeError('Access token not found in saved credentials')
  }

  return accessToken
}
