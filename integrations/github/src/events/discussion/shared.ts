import { DiscussionEvent } from '@octokit/webhooks-types'
import { getConversationFromTags } from 'src/misc/utils'
import { Client } from '.botpress'

export const getOrCreateDiscussionConversation = async ({
  githubEvent,
  client,
}: {
  githubEvent: DiscussionEvent
  client: Client
}) =>
  (await getConversationFromTags<'discussion'>(client, {
    channel: 'discussion',
    discussionNodeId: githubEvent.discussion.node_id,
  })) ?? (await _createDiscussionConversation({ githubEvent, client }))

const _createDiscussionConversation = async ({
  githubEvent,
  client,
}: {
  githubEvent: DiscussionEvent
  client: Client
}) => {
  // The octokit type for discussion events is incomplete: it lacks the category
  // node id, but it's present in the event payload and documented in the
  // GitHub API docs. We thus cast the event to add the missing property.
  // A PR to fix the type in the octokit library has been submitted and is
  // pending review: https://github.com/octokit/webhooks/pull/960
  const castedEvent = githubEvent as DiscussionEvent & { discussion: { category: { node_id: string } } }

  const { conversation } = await client.createConversation({
    channel: 'discussion',
    tags: {
      discussionNodeId: castedEvent.discussion.node_id,
      discussionNumber: castedEvent.discussion.number.toString(),
      discussionUrl: castedEvent.discussion.html_url,
      discussionId: castedEvent.discussion.id.toString(),
      discussionCategoryId: castedEvent.discussion.category.id.toString(),
      discussionCategoryName: castedEvent.discussion.category.name,
      discussionCategoryNodeId: castedEvent.discussion.category.node_id,
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
