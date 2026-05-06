import Stripe from 'stripe'
import { StripeApi } from '../client'
import { StripeOAuthClient } from './stripe-oauth-client'
import * as bp from '.botpress'

type CreateProps = {
  client: bp.Client
  ctx: bp.Context
  logger: bp.Logger
}

export class StripeClient extends StripeApi {
  public static async createFromStates({ client, ctx, logger }: CreateProps): Promise<StripeClient> {
    const oauth = new StripeOAuthClient({ client, ctx, logger })
    const { accessToken } = await oauth.getAuthState()
    return new StripeClient(accessToken, ctx.configuration.apiVersion)
  }

  public async createWebhookEndpointWithSecret(
    webhookData: Stripe.WebhookEndpointCreateParams
  ): Promise<{ id: string; secret: string }> {
    const webhook = await this.createWebhook(webhookData)
    if (!webhook.secret) {
      throw new Error('Stripe did not return a webhook signing secret on creation')
    }
    return { id: webhook.id, secret: webhook.secret }
  }
}
