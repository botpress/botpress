import { CalendlyClient } from './calendly-api'
import type { GetCurrentUserResp, WebhookDetails } from './calendly-api/schemas'
import { Supplier } from './types'
import { generateSigningKey } from './webhooks/signing-key'
import * as bp from '.botpress'

const performUnregistration = async (
  calendlyClient: CalendlyClient,
  userResp: GetCurrentUserResp,
  webhookUrl: string
) => {
  const { current_organization: organizationUri, uri: userUri } = userResp.resource

  // This will break if for some reason the calendly account has over 100 webhooks
  const webhooksToDelete: WebhookDetails[] = (
    await calendlyClient.getWebhooksList({
      scope: 'user',
      organization: organizationUri,
      user: userUri,
    })
  ).collection.filter((webhook) => webhook.callback_url === webhookUrl)

  for (const webhook of webhooksToDelete) {
    await calendlyClient.removeWebhook(webhook.uri)
  }
}

export const unregister: bp.Integration['unregister'] = async (props) => {
  const calendlyClient = await CalendlyClient.create(props)
  const currentUser = await calendlyClient.getCurrentUser()
  await performUnregistration(calendlyClient, currentUser, props.webhookUrl)
}

export const register: bp.Integration['register'] = async (props) => {
  const calendlyClient = await CalendlyClient.create(props)
  const userResp = await calendlyClient.getCurrentUser()

  try {
    await performUnregistration(calendlyClient, userResp, props.webhookUrl)
  } catch {
    // Do nothing since if it's the first time there's nothing to unregister
  }

  const { current_organization: organizationUri, uri: userUri } = userResp.resource

  await calendlyClient.createWebhook({
    webhookUrl: props.webhookUrl,
    events: ['invitee.created', 'invitee.canceled', 'invitee_no_show.created', 'invitee_no_show.deleted'],
    organization: organizationUri,
    user: userUri,
    scope: 'user',
    signingKey: await _getWebhookSigningKey(props.client, props.ctx),
  })
}

const _getWebhookSigningKey = async (client: bp.Client, ctx: bp.Context): Promise<string> => {
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

const _getSigningKey = async (client: bp.Client, ctx: bp.Context, fallbackValue: Supplier<string>) => {
  const { state } = await client.getOrSetState({
    type: 'integration',
    name: 'webhooks',
    id: ctx.integrationId,
    payload: {
      signingKey: fallbackValue(),
    },
  })

  return state.payload.signingKey
}

const _getOAuthSigningKey = async (client: bp.Client, ctx: bp.Context) =>
  _getSigningKey(client, ctx, () => bp.secrets.OAUTH_WEBHOOK_SIGNING_KEY)

const _getManualPatSigningKey = async (client: bp.Client, ctx: bp.Context) =>
  _getSigningKey(client, ctx, generateSigningKey)
