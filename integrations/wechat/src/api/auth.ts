import { RuntimeError } from '@botpress/sdk'
import axios from 'axios'
import { Result } from '../types'
import { usePromiseToResult } from '../utils'
import { WECHAT_API_BASE } from './constants'
import { weChatAuthTokenRespSchema } from './schemas'
import * as bp from '.botpress'

const MS_PER_SECOND = 1000
const SECONDS_PER_MINUTE = 60 as const
const TOKEN_EXPIRY_BUFFER = 5 * SECONDS_PER_MINUTE

type TokenResp = { accessToken: string; expiresAt: number }

async function _getFreshAccessToken(appId: string, appSecret: string): Promise<Result<TokenResp>> {
  const tokenIssuedAtMs = Date.now()
  const respResult = await axios
    .get(`${WECHAT_API_BASE}/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`)
    .then(...usePromiseToResult('Failed to acquire a WeChat access token'))
  if (!respResult.success) return respResult
  const resp = respResult.data

  const result = weChatAuthTokenRespSchema.safeParse(resp.data)
  if (!result.success) {
    return {
      success: false,
      error: new RuntimeError(`Unexpected access token response received -> ${result.error.message}`),
    }
  }

  const { data } = result
  if ('errcode' in data) {
    return {
      success: false,
      error: new RuntimeError(
        `Failed to acquire a WeChat access token (Error Code: ${data.errcode}) -> ${data.errmsg}`
      ),
    }
  }

  return {
    success: true,
    data: {
      accessToken: data.access_token,
      expiresAt: tokenIssuedAtMs / MS_PER_SECOND + data.expires_in,
    },
  }
}

async function _getCachedAccessToken(client: bp.Client, ctx: bp.Context): Promise<Result<TokenResp>> {
  const state = await client.getState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
  })

  const { auth = null } = state.state.payload
  if (auth === null) {
    return {
      success: false,
      error: new RuntimeError('No access token has been cached'),
    }
  }

  return {
    success: true,
    data: auth,
  }
}

const _applyTokenToCache = async (client: bp.Client, ctx: bp.Context, resp: TokenResp) => {
  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: {
      auth: resp,
    },
  })
}

export const getOrRefreshAccessToken = async ({ client, ctx }: bp.CommonHandlerProps) => {
  let tokenResult = await _getCachedAccessToken(client, ctx)

  let cacheToken = false
  if (!tokenResult.success || tokenResult.data.expiresAt >= Date.now() - TOKEN_EXPIRY_BUFFER) {
    const { appId, appSecret } = ctx.configuration
    tokenResult = await _getFreshAccessToken(appId, appSecret)
    cacheToken = true
  }

  if (!tokenResult.success) throw tokenResult.error
  const tokenResp = tokenResult.data

  if (cacheToken) {
    await _applyTokenToCache(client, ctx, tokenResp)
  }

  return tokenResp.accessToken
}
