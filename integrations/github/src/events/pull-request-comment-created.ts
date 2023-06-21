import { Client } from '@botpress/client'
import { IssueCommentCreatedEvent } from '@octokit/webhooks-types'

import { getUserAndConversation } from '../misc/utils'

export const firePullRequestCommentCreated = async ({
  githubEvent,
  client,
}: {
  githubEvent: IssueCommentCreatedEvent
  client: Client
}) => {
  await client.createMessage({
    tags: { id: githubEvent.comment.id.toString() },
    type: 'text',
    payload: {
      text: githubEvent.comment.body,
      targets: {
        pullRequest: githubEvent.issue.number.toString(),
      },
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
