import * as sdk from '@botpress/sdk'
import { verify as verifyWebhook } from '@octokit/webhooks-methods'
import type { WebhookEvent } from '@octokit/webhooks-types'

import { GITHUB_SIGNATURE_HEADER } from './const'
import { fireDiscussionCommentCreated } from './events/discussion/discussion-comment-created'
import { fireDiscussionCommentReplied } from './events/discussion/discussion-comment-replied'
import { fireDiscussionCreated } from './events/discussion/discussion-created'
import { fireIssueCommentCreated } from './events/issue/issue-comment-created'
import { fireIssueOpened } from './events/issue/issue-opened'
import { firePullRequestCommentCreated } from './events/pull-request/pull-request-comment-created'
import { firePullRequesMerged } from './events/pull-request/pull-request-merged'
import { firePullRequestOpened } from './events/pull-request/pull-request-opened'
import { firePullRequestReviewCommentCreated } from './events/pull-request/pull-request-review-comment-created'
import { firePullRequestReviewCommentReplied } from './events/pull-request/pull-request-review-comment-replied'
import { firePullRequestReviewSubmitted } from './events/pull-request/pull-request-review-submitted'
import { GithubSettings } from './misc/github-settings'
import {
  isIssueOpenedEvent,
  isPingEvent,
  isPullRequestCommentCreatedEvent,
  isPullRequestReviewCommentCreatedEvent,
  isPullRequestReviewCommentReplyCreatedEvent,
  isPullRequestReviewSubmittedEvent,
  isPullRequestMergedEvent,
  isPullRequestOpenedEvent,
  isIssueCommentCreatedEvent,
  isDiscussionCreatedEvent,
  isDiscussionCommentCreatedEvent,
  isDiscussionCommentReplyCreatedEvent,
} from './misc/guards'

import * as bp from '.botpress'

type WebhookEventHandlerEntry<T extends WebhookEvent> = Readonly<
  [(event: WebhookEvent) => event is T, (props: bp.HandlerProps & { githubEvent: T }) => Promise<void> | void]
>
const EVENT_HANDLERS: Readonly<WebhookEventHandlerEntry<any>[]> = [
  [isPingEvent, () => {}],
  [isIssueOpenedEvent, fireIssueOpened],
  [isIssueCommentCreatedEvent, fireIssueCommentCreated],
  [isPullRequestOpenedEvent, firePullRequestOpened],
  [isPullRequestMergedEvent, firePullRequesMerged],
  [isPullRequestCommentCreatedEvent, firePullRequestCommentCreated],
  [isPullRequestReviewCommentCreatedEvent, firePullRequestReviewCommentCreated],
  [isPullRequestReviewCommentReplyCreatedEvent, firePullRequestReviewCommentReplied],
  [isPullRequestReviewSubmittedEvent, firePullRequestReviewSubmitted],
  [isDiscussionCreatedEvent, fireDiscussionCreated],
  [isDiscussionCommentCreatedEvent, fireDiscussionCommentCreated],
  [isDiscussionCommentReplyCreatedEvent, fireDiscussionCommentReplied],
] as const

export const handler: bp.IntegrationProps['handler'] = async (props) => {
  if (_isOauthRequest(props)) {
    return await _handleOauthRequest(props)
  }

  if (!(await _isSignatureValid(props))) {
    return _handleInvalidSignature(props)
  }

  await _dispatchEvent(props)
}

const _isOauthRequest = ({ req }: bp.HandlerProps) => req.path === '/oauth'

const _handleOauthRequest = async ({ req, client, ctx, logger }: bp.HandlerProps) => {
  logger.forBot().info('Handling incoming OAuth callback')
  return _handleOauth(req, client, ctx).catch((err) => {
    logger.forBot().error('Error while processing OAuth callback', err.response?.data || err.message)
    throw err
  })
}

const _handleOauth = async (req: sdk.Request, client: bp.Client, ctx: bp.Context) => {
  const parsedQueryString = new URLSearchParams(req.query)
  const installationIdStr = parsedQueryString.get('installation_id')

  if (!installationIdStr) {
    throw new sdk.RuntimeError('Missing installation_id in query string')
  }

  const installationId = Number(installationIdStr)

  await _saveInstallationId({ ctx, client, installationId })
  await client.configureIntegration({ identifier: installationIdStr })
}

const _saveInstallationId = async ({
  ctx,
  client,
  installationId,
}: {
  ctx: bp.Context
  client: bp.Client
  installationId: number
}) => {
  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: {
      githubInstallationId: installationId,
    },
  })
}

const _isSignatureValid = async ({ ctx, req: { headers, body } }: bp.HandlerProps) => {
  const signature = headers[GITHUB_SIGNATURE_HEADER]
  const webhookSecret = GithubSettings.getWebhookSecret({ ctx })

  return body && signature && verifyWebhook(webhookSecret, body, signature)
}

const _handleInvalidSignature = async ({ req: { headers, body }, logger }: bp.HandlerProps) => {
  const { [GITHUB_SIGNATURE_HEADER]: signature } = headers

  if (!(body && signature)) {
    return console.warn('Body or signature is missing from the webhook request')
  }

  logger
    .forBot()
    .warn("Invalid signature for webhook request. Please update the webhook secret in the GitHub app's settings page.")

  return console.warn('Invalid webhook signature', signature)
}

const _dispatchEvent = async (props: bp.HandlerProps) => {
  const event: WebhookEvent = JSON.parse(props.req.body ?? '')

  for (const [eventGuard, fireEvent] of EVENT_HANDLERS) {
    if (eventGuard(event)) {
      props.logger.forBot().debug(`Event matched with ${eventGuard.name}: firing handler ${fireEvent.name}`)
      return await fireEvent({ ...props, githubEvent: event })
    }
  }

  console.warn('Unsupported github event', event)
}
