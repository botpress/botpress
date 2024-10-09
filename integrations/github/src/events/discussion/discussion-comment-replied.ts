import { DiscussionCommentCreatedEvent } from '@octokit/webhooks-types'
import { wrapEvent } from 'src/misc/event-wrapper'
import { getConversationFromTags } from '../../misc/utils'
import * as bp from '.botpress'

type DiscussionCommentRepliedEvent = DiscussionCommentCreatedEvent & { comment: { parent_id: number } }

export const fireDiscussionCommentReplied = wrapEvent<DiscussionCommentRepliedEvent>({
  async event({ githubEvent, client, eventSender }) {
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
  },
  errorMessage: 'Failed to handle discussion comment replied event',
})

const _createDiscussionReplyConversation = async ({
  githubEvent,
  client,
}: {
  githubEvent: DiscussionCommentRepliedEvent
  client: bp.Client
}) => {
  const { conversation } = await client.createConversation({
    channel: 'discussionComment',
    tags: {
      discussionNodeId: githubEvent.discussion.node_id,
      discussionNumber: githubEvent.discussion.number.toString(),
      discussionUrl: githubEvent.discussion.html_url,
      discussionId: githubEvent.discussion.id.toString(),
      discussionCategoryId: githubEvent.discussion.category.id.toString(),
      discussionCategoryName: githubEvent.discussion.category.name,
      discussionCategoryNodeId: githubEvent.discussion.category.node_id,
      parentCommentId: githubEvent.comment.parent_id.toString(),
      repoId: githubEvent.repository.id.toString(),
      repoName: githubEvent.repository.name,
      repoNodeId: githubEvent.repository.node_id,
      repoOwnerId: githubEvent.repository.owner.id.toString(),
      repoOwnerName: githubEvent.repository.owner.login,
      repoOwnerUrl: githubEvent.repository.owner.html_url,
      repoUrl: githubEvent.repository.html_url,
    },
  })

  return conversation
}
