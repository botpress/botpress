import { IssueCommentCreatedEvent } from '@octokit/webhooks-types'
import { IntegrationClient } from '../misc/types'
import { getUserAndConversation } from '../misc/utils'

export const firePullRequestCommentCreated = async ({
  githubEvent,
  client,
}: {
  githubEvent: IssueCommentCreatedEvent
  client: IntegrationClient
}) => {
  await client.createMessage({
    tags: { id: githubEvent.comment.id.toString() },
    type: 'text',
    payload: {
      text: githubEvent.comment.body,
    },
    ...(await getUserAndConversation(
      {
        githubUserId: githubEvent.comment.user.id,
        githubChannelId: githubEvent.issue.number,
        githubChannel: 'pullRequest',
      },
      client
    )),
  })
}
