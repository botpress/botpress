import type { WebhookEvent } from '@octokit/webhooks-types'

type CommonMessage = { content: string; conversationId: number; userId: number; messageId: number }

type PullRequestMessage = CommonMessage & { channel: 'pullRequest' }
type IssueMessage = CommonMessage & { channel: 'issue' }
type DiscussionMessage = CommonMessage & { channel: 'discussion' }

type GithubMessage = PullRequestMessage | IssueMessage | DiscussionMessage

// eslint-disable-next-line complexity
export const parseGithubEvent = (event: WebhookEvent): GithubMessage | undefined => {
  const isPullRequestOpenedEvent = 'pull_request' in event && event.action === 'opened'
  if (isPullRequestOpenedEvent) {
    return {
      content: event.pull_request.body ?? '',
      conversationId: event.pull_request.number,
      userId: event.pull_request.user.id,
      messageId: event.pull_request.id,
      channel: 'pullRequest',
    }
  }

  const isPullRequestCommentCreatedEvent =
    'issue' in event && 'pull_request' in event.issue && 'comment' in event && event.action === 'created'
  if (isPullRequestCommentCreatedEvent) {
    return {
      content: event.comment.body,
      conversationId: event.issue.number,
      userId: event.comment.user.id,
      messageId: event.comment.id,
      channel: 'pullRequest',
    }
  }

  const isIssueOpenedEvent = 'issue' in event && event.action === 'opened'
  if (isIssueOpenedEvent) {
    return {
      content: event.issue.body ?? '',
      conversationId: event.issue.number,
      userId: event.issue.user.id,
      messageId: event.issue.id,
      channel: 'issue',
    }
  }

  const isIssueCommentCreatedEvent =
    'issue' in event && !('pull_request' in event.issue) && 'comment' in event && event.action === 'created'
  if (isIssueCommentCreatedEvent) {
    return {
      content: event.comment.body ?? '',
      conversationId: event.issue.number,
      userId: event.comment.user.id,
      messageId: event.comment.id,
      channel: 'issue',
    }
  }

  const isDiscussionOpenedEvent = 'discussion' in event && event.action === 'created'
  if (isDiscussionOpenedEvent) {
    return {
      content: event.discussion.body ?? '',
      conversationId: event.discussion.number,
      userId: event.discussion.user.id,
      messageId: event.discussion.id,
      channel: 'discussion',
    }
  }

  const isDiscussionCommentCreatedEvent = 'discussion' in event && 'comment' in event && event.action === 'created'
  if (isDiscussionCommentCreatedEvent) {
    return {
      content: event.comment.body ?? '',
      conversationId: event.discussion.number,
      userId: event.comment.user.id,
      messageId: event.comment.id,
      channel: 'discussion',
    }
  }
  return
}
