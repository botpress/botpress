import { generateSelectDialog } from '@botpress/common/src/html-dialogs'
import { generateRedirection, getInterstitialUrl } from '@botpress/common/src/oauth-wizard/interstitial'
import * as sdk from '@botpress/sdk'
import { verify as verifyWebhook } from '@octokit/webhooks-methods'
import type { WebhookEvent } from '@octokit/webhooks-types'
import { App as OctokitApp, Octokit } from 'octokit'

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
import { firePushReceived } from './events/push/push-received'
import { GithubSettings } from './misc/github-settings'
import {
  isIssueOpenedEvent,
  isPingEvent,
  isPushEvent,
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
  [isPushEvent, firePushReceived],
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

const _isOauthRequest = ({ req }: bp.HandlerProps) => req.path.startsWith('/oauth')

const _handleOauthRequest = async (props: bp.HandlerProps) => {
  const { logger } = props
  try {
    return await _routeOauthRequest(props)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const errorMessage = 'OAuth error: ' + msg
    logger.forBot().error(errorMessage)
    return generateRedirection(getInterstitialUrl(false, errorMessage))
  }
}

const _routeOauthRequest = async ({ req, client, ctx, logger }: bp.HandlerProps) => {
  const query = new URLSearchParams(req.query)
  const state = query.get('state') ?? ''

  // Step 1 — entry point from the connect link: redirect the user to GitHub's
  // user-authorization screen. Unlike the app-install flow, this always echoes
  // `state` back, so it works whether or not the app is already installed.
  if (req.path === '/oauth/start') {
    logger.forBot().info('Starting GitHub OAuth authorization')
    const authorizeUrl = new URL('https://github.com/login/oauth/authorize')
    authorizeUrl.searchParams.set('client_id', bp.secrets.GITHUB_CLIENT_ID)
    authorizeUrl.searchParams.set('state', state)
    return generateRedirection(authorizeUrl)
  }

  // Step 3 — the user picked an installation in the chooser rendered below.
  if (req.path === '/oauth/select') {
    const installationId = query.get('installation_id')
    if (!installationId) {
      throw new sdk.RuntimeError('No GitHub account was selected')
    }
    await _connectInstallation({ ctx, client, logger, installationId })
    return generateRedirection(getInterstitialUrl(true))
  }

  // Step 2 — the GitHub callback (/oauth).
  logger.forBot().info('Handling GitHub OAuth callback')

  const oauthError = query.get('error')
  if (oauthError) {
    const description = query.get('error_description')
    throw new sdk.RuntimeError(`${oauthError}${description ? ` - ${description}` : ''}`)
  }

  // Fresh-install redirect (or the 0-installation fallback below): GitHub
  // provides the installation id directly, no code exchange needed.
  const code = query.get('code')
  const installationIdFromInstall = query.get('installation_id')
  if (installationIdFromInstall && !code) {
    await _connectInstallation({ ctx, client, logger, installationId: installationIdFromInstall })
    return generateRedirection(getInterstitialUrl(true))
  }

  // User-authorization callback: exchange the code, then resolve which
  // installation to connect.
  if (!code) {
    throw new sdk.RuntimeError('Missing authorization code in OAuth callback')
  }

  const userToken = await _exchangeCodeForUserToken(code)
  const installations = await _listUserInstallations(userToken)

  if (installations.length === 0) {
    // Authorized, but the app isn't installed on any account yet. Send the user
    // to install it; the install redirect carries installation_id + state.
    const slug = await _getAppSlug({ ctx, client })
    const installUrl = new URL(`https://github.com/apps/${slug}/installations/new`)
    installUrl.searchParams.set('state', state)
    return generateRedirection(installUrl)
  }

  if (installations.length === 1) {
    await _connectInstallation({ ctx, client, logger, installationId: String(installations[0]!.id) })
    return generateRedirection(getInterstitialUrl(true))
  }

  // Multiple installations: let the user choose which account to connect. The
  // form submits via GET, so `state` travels in the query string where the
  // bridge needs it to route the submission back to this integration.
  return generateSelectDialog({
    pageTitle: 'Select GitHub account',
    helpText: 'Choose which GitHub account or organization to connect to this bot.',
    formFieldName: 'installation_id',
    formSubmitUrl: new URL('/oauth/select', process.env.BP_WEBHOOK_URL ?? ''),
    extraHiddenParams: { state },
    options: installations.map((installation) => ({ label: installation.label, value: String(installation.id) })),
  })
}

const _connectInstallation = async ({
  ctx,
  client,
  logger,
  installationId,
}: {
  ctx: bp.Context
  client: bp.Client
  logger: bp.Logger
  installationId: string
}) => {
  await _saveInstallationId({ ctx, client, installationId: Number(installationId) })
  logger.forBot().info(`Connected GitHub installation ${installationId}`)
  await client.configureIntegration({ identifier: installationId })
}

const _exchangeCodeForUserToken = async (code: string): Promise<string> => {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: bp.secrets.GITHUB_CLIENT_ID,
      client_secret: bp.secrets.GITHUB_CLIENT_SECRET,
      code,
    }),
  })

  const data = (await response.json()) as { access_token?: string; error?: string; error_description?: string }
  if (!data.access_token) {
    throw new sdk.RuntimeError(
      `Failed to exchange authorization code: ${data.error_description ?? data.error ?? 'unknown error'}`
    )
  }
  return data.access_token
}

const _listUserInstallations = async (userToken: string): Promise<{ id: number; label: string }[]> => {
  const octokit = new Octokit({ auth: userToken })
  const { data } = await octokit.rest.apps.listInstallationsForAuthenticatedUser({ per_page: 100 })
  return data.installations.map((installation) => ({
    id: installation.id,
    label:
      installation.account && 'login' in installation.account
        ? installation.account.login
        : `Installation ${installation.id}`,
  }))
}

const _getAppSlug = async ({ ctx, client }: { ctx: bp.Context; client: bp.Client }): Promise<string> => {
  const { appId, privateKey } = GithubSettings.getAppSettings({ ctx, client })
  const app = new OctokitApp({ appId, privateKey })
  const { data } = await app.octokit.rest.apps.getAuthenticated()
  return data?.slug ?? 'botpress'
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
  // Merge with existing configuration so we don't clobber organizationHandle
  // (setState replaces the whole payload).
  let existing: { githubInstallationId?: number; organizationHandle?: string } = {}
  try {
    const { state } = await client.getState({ type: 'integration', name: 'configuration', id: ctx.integrationId })
    existing = state.payload ?? {}
  } catch {}

  await client.setState({
    type: 'integration',
    name: 'configuration',
    id: ctx.integrationId,
    payload: {
      ...existing,
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
