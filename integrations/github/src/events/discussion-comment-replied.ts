import { DiscussionCommentCreatedEvent } from '@octokit/webhooks-types'
import { wrapEvent } from 'src/misc/event-wrapper'
import { getConversationFromTags, getOrCreateBotpressConversationFromGithubDiscussionReply } from '../misc/utils'
import { Client } from '.botpress'

export const fireDiscussionCommentReplied = wrapEvent<DiscussionCommentCreatedEvent>(
  async ({ githubEvent, client, user }) => {
    if (!githubEvent.comment.parent_id) {
      return
    }

    let conversation = await getConversationFromTags<'discussionComment'>(client, {
      discussionNodeId: githubEvent.discussion.node_id,
      parentCommentId: githubEvent.comment.parent_id.toString(),
    })

    if (!conversation) {
      conversation = await _createDiscussionConversation({ githubEvent, client })
    }

    await client.createMessage({
      tags: {
        commentId: githubEvent.comment.id.toString(),
        commentNodeId: githubEvent.comment.node_id,
        commentUrl: githubEvent.comment.html_url,
      },
      type: 'text',
      payload: {
        text: githubEvent.comment.body,
      },
      conversationId: conversation.id,
      userId: user.id,
    })
  }
)

const _createDiscussionConversation = async ({
  githubEvent,
  client,
}: {
  githubEvent: DiscussionCommentCreatedEvent
  client: Client
}) => {
  // The octokit type for this event is not complete: it lacks the category
  // node id, but it's present in the event payload and documented in the
  // GitHub API docs. We thus cast the event to add the missing property.
  // A PR to fix the type in the octokit library has been submitted and is
  // pending review: https://github.com/octokit/webhooks/pull/960
  const castedEvent = githubEvent as DiscussionCommentCreatedEvent & { discussion: { category: { node_id: string } } }

  if (!castedEvent.comment.parent_id) {
    throw new Error('Parent comment ID is missing')
  }

  const githubDiscussion = {
    ...castedEvent,
    comment: { parent_id: castedEvent.comment.parent_id },
    ...castedEvent.discussion,
  }
  const conversation = await getOrCreateBotpressConversationFromGithubDiscussionReply({
    githubDiscussion,
    client,
  })

  return conversation
}
