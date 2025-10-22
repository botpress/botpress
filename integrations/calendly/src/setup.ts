import { CalendlyClient } from './calendly-api'
import type { GetCurrentUserResp, WebhookDetails } from './calendly-api/schemas'
import { getWebhookSigningKey } from './webhooks/signing-key'
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
    // Simply checking if webhook subscriptions exists then skipping following logic won't work here.
    // This is because such an approach may lead to a de-synchronization of the webhook signing key.
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
    signingKey: await getWebhookSigningKey(props),
  })
}
