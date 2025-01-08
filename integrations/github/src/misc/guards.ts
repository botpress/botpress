import type {
  DiscussionCommentCreatedEvent,
  DiscussionCreatedEvent,
  IssueCommentCreatedEvent,
  IssuesOpenedEvent,
  PingEvent,
  PullRequestClosedEvent,
  PullRequestOpenedEvent,
  PullRequestReviewCommentCreatedEvent,
  PullRequestReviewSubmittedEvent,
  WebhookEvent,
} from '@octokit/webhooks-types'

export const isPingEvent = (event: WebhookEvent): event is PingEvent => 'hook_id' in event && 'zen' in event

/** Regular pull request comments */
export const isPullRequestCommentCreatedEvent = (event: WebhookEvent): event is IssueCommentCreatedEvent =>
  'issue' in event && 'pull_request' in event.issue && 'comment' in event && event.action === 'created'

/** Comment on a pull request's diff (this effectively creates a new thread) */
export const isPullRequestReviewCommentCreatedEvent = (
  event: WebhookEvent
): event is PullRequestReviewCommentCreatedEvent =>
  'pull_request' in event && 'comment' in event && event.action === 'created' && !event.comment.in_reply_to_id

/** Reply to a comment on a pull request's diff (replies to an existing thread) */
export const isPullRequestReviewCommentReplyCreatedEvent = (
  event: WebhookEvent
): event is PullRequestReviewCommentCreatedEvent =>
  'pull_request' in event && 'comment' in event && event.action === 'created' && !!event.comment.in_reply_to_id

/** New review submitted, with optionally an accompanying comment */
export const isPullRequestReviewSubmittedEvent = (event: WebhookEvent): event is PullRequestReviewSubmittedEvent =>
  'pull_request' in event && 'review' in event && event.action === 'submitted'

export const isPullRequestOpenedEvent = (event: WebhookEvent): event is PullRequestOpenedEvent =>
  'pull_request' in event && event.action === 'opened'

export const isPullRequestMergedEvent = (event: WebhookEvent): event is PullRequestClosedEvent =>
  'pull_request' in event && event.action === 'closed' && event.pull_request.merged

export const isIssueCommentCreatedEvent = (event: WebhookEvent): event is IssueCommentCreatedEvent =>
  'issue' in event && !('pull_request' in event.issue) && 'comment' in event && event.action === 'created'

export const isIssueOpenedEvent = (event: WebhookEvent): event is IssuesOpenedEvent =>
  'issue' in event && event.action === 'opened'

export const isDiscussionCreatedEvent = (event: WebhookEvent): event is DiscussionCreatedEvent =>
  'discussion' in event && event.action === 'created' && !('comment' in event)

export const isDiscussionCommentCreatedEvent = (event: WebhookEvent): event is DiscussionCommentCreatedEvent =>
  'discussion' in event && 'comment' in event && event.action === 'created' && !event.comment.parent_id

export const isDiscussionCommentReplyCreatedEvent = (event: WebhookEvent): event is DiscussionCommentCreatedEvent =>
  'discussion' in event && 'comment' in event && event.action === 'created' && !!event.comment.parent_id
