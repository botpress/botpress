import type { Conversation } from '@botpress/client'
import type { AckFunction } from '@botpress/sdk'
import type { WebhookEvent } from '@octokit/webhooks-types'
import { INTEGRATION_NAME } from '../const'
import {
  isDiscussionCommentCreatedEvent,
  isDiscussionCreatedEvent,
  isIssueCommentCreatedEvent,
  isIssueOpenedEvent,
  isPullRequestCommentCreatedEvent,
  isPullRequestOpenedEvent,
} from './guards'
import { Client } from './types'

type CommonMessage = { content: string; conversationId: number; userId: number; messageId: number }

type PullRequestMessage = CommonMessage & { channel: 'pullRequest' }
type IssueMessage = CommonMessage & { channel: 'issue' }
type DiscussionMessage = CommonMessage & { channel: 'discussion' }

type GithubMessage = PullRequestMessage | IssueMessage | DiscussionMessage

export const parseGithubEvent = (event: WebhookEvent): GithubMessage | undefined => {
  if (isPullRequestOpenedEvent(event)) {
    return {
      content: event.pull_request.body ?? '',
      conversationId: event.pull_request.number,
      userId: event.pull_request.user.id,
      messageId: event.pull_request.id,
      channel: 'pullRequest',
    }
  }

  if (isPullRequestCommentCreatedEvent(event)) {
    return {
      content: event.comment.body,
      conversationId: event.issue.number,
      userId: event.comment.user.id,
      messageId: event.comment.id,
      channel: 'pullRequest',
    }
  }

  if (isIssueOpenedEvent(event)) {
    return {
      content: event.issue.body ?? '',
      conversationId: event.issue.number,
      userId: event.issue.user.id,
      messageId: event.issue.id,
      channel: 'issue',
    }
  }

  if (isIssueCommentCreatedEvent(event)) {
    return {
      content: event.comment.body ?? '',
      conversationId: event.issue.number,
      userId: event.comment.user.id,
      messageId: event.comment.id,
      channel: 'issue',
    }
  }

  if (isDiscussionCommentCreatedEvent(event)) {
    return {
      content: event.comment.body ?? '',
      conversationId: event.discussion.number,
      userId: event.comment.user.id,
      messageId: event.comment.id,
      channel: 'discussion',
    }
  }

  if (isDiscussionCreatedEvent(event)) {
    return {
      content: event.discussion.body ?? '',
      conversationId: event.discussion.number,
      userId: event.discussion.user.id,
      messageId: event.discussion.id,
      channel: 'discussion',
    }
  }

  return
}

export function getConversationId(conversation: Conversation): number {
  const id = getTag(conversation.tags, 'number')

  if (!id) {
    throw Error(`No chat found for conversation ${conversation.id}`)
  }

  return Number(id)
}

export async function ackMessage(messageId: number, ack: AckFunction) {
  await ack({ tags: { id: messageId.toString() } })
}

export const getTag = (tags: Record<string, string>, name: string) => {
  return tags[`${INTEGRATION_NAME}:${name}`]
}

export const getUserAndConversation = async (
  props: { githubUserId: string | number; githubChannelId: string | number; githubChannel: 'pullRequest' },
  client: Client
) => {
  const { conversation } = await client.getOrCreateConversation({
    channel: props.githubChannel,
    tags: { number: props.githubChannelId.toString() },
  })
  const { user } = await client.getOrCreateUser({ tags: { id: props.githubUserId.toString() } })

  return {
    userId: user.id,
    conversationId: conversation.id,
  }
}
