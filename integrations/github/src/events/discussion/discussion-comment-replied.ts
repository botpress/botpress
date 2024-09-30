import { DiscussionCommentCreatedEvent } from '@octokit/webhooks-types'
import { wrapEvent } from 'src/misc/event-wrapper'
import { getConversationFromTags } from '../../misc/utils'
import { Client } from '.botpress'

type DiscussionCommentRepliedEvent = DiscussionCommentCreatedEvent & { comment: { parent_id: number } }

export const fireDiscussionCommentReplied = wrapEvent<DiscussionCommentRepliedEvent>(
  async ({ githubEvent, client, eventSender }) => {
    const conversation =
      (await getConversationFromTags<'discussionComment'>(client, {
        discussionNodeId: githubEvent.discussion.node_id,
        parentCommentId: githubEvent.comment.parent_id.toString(),
      })) ?? (await _createDiscussionReplyConversation({ githubEvent, client }))

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
      userId: eventSender.botpressUser,
    })
  }
)

const _createDiscussionReplyConversation = async ({
  githubEvent,
  client,
}: {
  githubEvent: DiscussionCommentRepliedEvent
  client: Client
}) => {
  // The octokit type for this event is not complete: it lacks the category
  // node id, but it's present in the event payload and documented in the
  // GitHub API docs. We thus cast the event to add the missing property.
  // A PR to fix the type in the octokit library has been submitted and is
  // pending review: https://github.com/octokit/webhooks/pull/960
  const castedEvent = githubEvent as DiscussionCommentRepliedEvent & {
    discussion: { category: { node_id: string } }
  }

  const { conversation } = await client.createConversation({
    channel: 'discussionComment',
    tags: {
      discussionNodeId: castedEvent.discussion.node_id,
      discussionNumber: castedEvent.discussion.number.toString(),
      discussionUrl: castedEvent.discussion.html_url,
      discussionId: castedEvent.discussion.id.toString(),
      discussionCategoryId: castedEvent.discussion.category.id.toString(),
      discussionCategoryName: castedEvent.discussion.category.name,
      discussionCategoryNodeId: castedEvent.discussion.category.node_id,
      parentCommentId: castedEvent.comment.parent_id.toString(),
      repoId: castedEvent.repository.id.toString(),
      repoName: castedEvent.repository.name,
      repoNodeId: castedEvent.repository.node_id,
      repoOwnerId: castedEvent.repository.owner.id.toString(),
      repoOwnerName: castedEvent.repository.owner.login,
      repoOwnerUrl: castedEvent.repository.owner.html_url,
      repoUrl: castedEvent.repository.html_url,
    },
  })

  return conversation
}
