import { ExtraChannelProps, wrapChannel } from './misc/channel-wrapper'
import { AckFunction, Channels } from './misc/types'
import { getTagOrThrowException } from './misc/utils'

export default {
  pullRequest: {
    messages: {
      text: wrapChannel<'pullRequest'>(async ({ conversation, payload, ack, owner, repo, octokit }) => {
        console.info(`Sending a text message on channel pull request with content ${payload.text}`)

        await _createIssueComment({
          issueNumber: +getTagOrThrowException(conversation.tags, 'pullRequestNumber'),
          commentBody: payload.text,
          ack,
          owner,
          repo,
          octokit,
        })
      }),
    },
  },
  issue: {
    messages: {
      text: wrapChannel<'issue'>(async ({ conversation, payload, ack, owner, repo, octokit }) => {
        console.info(`Sending a text message on channel issue with content ${payload.text}`)

        await _createIssueComment({
          issueNumber: +getTagOrThrowException(conversation.tags, 'issueNumber'),
          commentBody: payload.text,
          ack,
          owner,
          repo,
          octokit,
        })
      }),
    },
  },
  discussion: {
    messages: {
      text: wrapChannel<'discussion'>(async ({ conversation, payload, ack, octokit }) => {
        console.info(`Sending a text message on channel discussion with content ${payload.text}`)

        const {
          addDiscussionComment: { comment },
        } = await octokit.executeGraphqlQuery('addDiscussionComment', {
          discussionNodeId: getTagOrThrowException(conversation.tags, 'discussionNodeId'),
          body: payload.text,
        })

        await ack({
          tags: { commentId: comment.databaseId.toString(), commentNodeId: comment.id, commentUrl: comment.url },
        })
      }),
    },
  },
} satisfies Channels

const _createIssueComment = async ({
  issueNumber,
  commentBody,
  ack,
  owner,
  repo,
  octokit,
}: { issueNumber: number; commentBody: string; ack: AckFunction } & ExtraChannelProps) => {
  const { data } = await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: commentBody,
  })

  await ack({ tags: { commentNodeId: data.node_id, commentId: data.id.toString(), commentUrl: data.html_url } })
}
