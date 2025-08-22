import crypto from 'crypto'
import { CommonHandlerProps } from '../types'
import * as bp from '.botpress'

const SIGNING_KEY_BYTES = 32

export const getWebhookSigningKey = async ({ client, ctx }: CommonHandlerProps): Promise<string> => {
  switch (ctx.configurationType) {
    case 'manual':
      return await _getManualPatSigningKey(client, ctx)
    case null:
      return _getOAuthSigningKey(client, ctx)
    default:
      // @ts-ignore
      throw new Error(`Unsupported configuration type: ${props.ctx.configurationType}`)
  }
}

/** Generate a 256-bit signing key (For Manual PAT Authentication). */
export function _generateSigningKey(): string {
  const raw = crypto.randomBytes(SIGNING_KEY_BYTES)
  return raw.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const _getSigningKey = async (client: bp.Client, ctx: bp.Context, fallbackValue: string) => {
  const { state } = await client.getOrSetState({
    type: 'integration',
    name: 'webhooks',
    id: ctx.integrationId,
    payload: {
      signingKey: fallbackValue,
    },
  })

  return state.payload.signingKey
}

const _getOAuthSigningKey = async (client: bp.Client, ctx: bp.Context) =>
  _getSigningKey(client, ctx, bp.secrets.OAUTH_WEBHOOK_SIGNING_KEY)

const _getManualPatSigningKey = async (client: bp.Client, ctx: bp.Context) =>
  _getSigningKey(client, ctx, _generateSigningKey())
