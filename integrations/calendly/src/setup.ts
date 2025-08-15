import type * as CalendlyDefs from 'definitions/calendly'
import { createWebhook, getCurrentUser, getWebhooksList, removeWebhook } from './calendly-api'
import { type CalendlyClient, createCalendlyClient } from './utils'
import type * as bp from '.botpress'

const performUnregistration = async (
  httpClient: CalendlyClient,
  userResp: CalendlyDefs.GetCurrentUserResp,
  webhookUrl: string
) => {
  const { current_organization: organizationUri, uri: userUri } = userResp.resource

  // This will break if for some reason the
  // calendly account has over 100 webhooks
  const webhooksToDelete: CalendlyDefs.WebhookDetails[] = (
    await Promise.all([
      getWebhooksList(httpClient, {
        scope: 'organization',
        organization: organizationUri,
      }),
      getWebhooksList(httpClient, {
        scope: 'user',
        organization: organizationUri,
        user: userUri,
      }),
    ])
  )
    .flatMap((resp) => resp.collection)
    .filter((webhook) => webhook.callback_url === webhookUrl)

  for (const webhook of webhooksToDelete) {
    await removeWebhook(httpClient, webhook.uri)
  }
}

export const unregister: bp.Integration['unregister'] = async ({ ctx, webhookUrl }) => {
  const httpClient = createCalendlyClient(ctx.configuration.accessToken)
  const currentUser = await getCurrentUser(httpClient)
  await performUnregistration(httpClient, currentUser, webhookUrl)
}

export const register: bp.Integration['register'] = async ({ ctx, webhookUrl }) => {
  const httpClient = createCalendlyClient(ctx.configuration.accessToken)
  const userResp = await getCurrentUser(httpClient)

  try {
    await performUnregistration(httpClient, userResp, webhookUrl)
  } catch {
    // Do nothing since if it's the first
    // time there's nothing to unregister
  }

  const { current_organization: organizationUri, uri: userUri } = userResp.resource

  await Promise.all([
    createWebhook(httpClient, {
      webhookUrl,
      events: ['invitee.created', 'invitee.canceled', 'invitee_no_show.created', 'invitee_no_show.deleted'],
      organization: organizationUri,
      user: userUri,
      scope: 'user',
    }),
    createWebhook(httpClient, {
      webhookUrl,
      events: ['routing_form_submission.created'],
      organization: organizationUri,
      scope: 'organization',
    }),
  ])
}
