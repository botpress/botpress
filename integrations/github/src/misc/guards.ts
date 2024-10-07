import type {
  IssueCommentCreatedEvent,
  IssuesOpenedEvent,
  PingEvent,
  PullRequestClosedEvent,
  PullRequestOpenedEvent,
  WebhookEvent,
} from '@octokit/webhooks-types'

export const isPingEvent = (event: WebhookEvent): event is PingEvent => 'hook_id' in event && 'zen' in event

/** Regular pull request comments */
export const isPullRequestCommentCreatedEvent = (event: WebhookEvent): event is IssueCommentCreatedEvent =>
  'issue' in event && 'pull_request' in event.issue && 'comment' in event && event.action === 'created'

export const isPullRequestOpenedEvent = (event: WebhookEvent): event is PullRequestOpenedEvent =>
  'pull_request' in event && event.action === 'opened'

export const isPullRequestMergedEvent = (event: WebhookEvent): event is PullRequestClosedEvent =>
  'pull_request' in event && event.action === 'closed' && event.pull_request.merged

export const isIssueOpenedEvent = (event: WebhookEvent): event is IssuesOpenedEvent =>
  'issue' in event && event.action === 'opened'
