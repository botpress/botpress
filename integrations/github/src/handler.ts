import { verify as verifyWebhook } from '@octokit/webhooks-methods'
import type { WebhookEvent } from '@octokit/webhooks-types'

import { GITHUB_SIGNATURE_HEADER } from './const'
import { firePullRequestCommentCreated } from './events/pull-request-comment-created'
import { firePullRequesMerged } from './events/pull-request-merged'
import { firePullRequestOpened } from './events/pull-request-opened'
import {
  isPingEvent,
  isPullRequestCommentCreatedEvent,
  isPullRequestMergedEvent,
  isPullRequestOpenedEvent,
} from './misc/guards'

import * as botpress from '.botpress'

export const handler: botpress.IntegrationProps['handler'] = async ({ req, ctx, client }) => {
  const signature = req.headers[GITHUB_SIGNATURE_HEADER]
  const { body } = req
  if (!(body && signature)) {
    return console.warn('Body or signature is missing')
  }

  const { state } = await client.getState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
  })

  if (!(await verifyWebhook(state.payload.webhookSecret, body, signature))) {
    return console.warn('Invalid webhook secret', state.payload.webhookSecret, signature)
  }

  const rawEvent: WebhookEvent = JSON.parse(body)
  if (isPingEvent(rawEvent)) {
    return
  }

  const event: WebhookEvent = rawEvent

  // ============ EVENTS ==============
  if (isPullRequestOpenedEvent(event)) {
    return firePullRequestOpened({ githubEvent: event, client })
  } else if (isPullRequestMergedEvent(event)) {
    return firePullRequesMerged({ githubEvent: event, client })
  }

  // ============ MESSAGES ==============
  if (isPullRequestCommentCreatedEvent(event)) {
    // if (event.sender.id === state.payload.botUserId) {
    //   return console.info('Ignoring comment created by bot')
    // }

    return firePullRequestCommentCreated({ githubEvent: event, client })
  }

  console.warn('Unsupported github event')
}
