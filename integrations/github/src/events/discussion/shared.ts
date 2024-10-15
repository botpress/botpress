import { DiscussionEvent } from '@octokit/webhooks-types'
import { getConversationFromTags } from 'src/misc/utils'
import * as bp from '.botpress'

export const getOrCreateDiscussionConversation = async ({
  githubEvent,
  client,
}: {
  githubEvent: DiscussionEvent
  client: bp.Client
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
  client: bp.Client
}) => {
  const { conversation } = await client.createConversation({
    channel: 'discussion',
    tags: {
      discussionNodeId: githubEvent.discussion.node_id,
      discussionNumber: githubEvent.discussion.number.toString(),
      discussionUrl: githubEvent.discussion.html_url,
      discussionId: githubEvent.discussion.id.toString(),
      discussionCategoryId: githubEvent.discussion.category.id.toString(),
      discussionCategoryName: githubEvent.discussion.category.name,
      discussionCategoryNodeId: githubEvent.discussion.category.node_id,
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
