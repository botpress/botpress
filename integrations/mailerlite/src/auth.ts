import * as bp from '.botpress'
import { RuntimeError } from '@botpress/client';

export const getAccessToken = async ({ client, ctx }: { client: bp.Client; ctx: bp.Context }) => {
    let accessToken: string | undefined
    if (ctx.configurationType === 'manual') {
      accessToken = ctx.configuration.APIKey
    }
    if (!accessToken){
        throw new RuntimeError('Access token not found in saved credentials')
    }
    return accessToken
  }