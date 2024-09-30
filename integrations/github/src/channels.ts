import { ExtraChannelProps, wrapChannel } from './misc/channel-wrapper'
import { AckFunction, Channels } from './misc/types'

export default {
  pullRequest: {
    messages: {
      text: wrapChannel<'pullRequest'>(async ({ conversation, payload, ack, owner, repo, octokit }) => {
        console.info(`Sending a text message on channel pull request with content ${payload.text}`)

        await _createIssueComment({
          issueNumber: _getIntTagOrThrowException(conversation.tags, 'pullRequestNumber'),
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
          issueNumber: _getIntTagOrThrowException(conversation.tags, 'issueNumber'),
          commentBody: payload.text,
          ack,
          owner,
          repo,
          octokit,
        })
      }),
    },
  },
  pullRequestReviewComment: {
    messages: {
      text: wrapChannel<'pullRequestReviewComment'>(
        async ({ conversation, payload, ack, client, owner, repo, octokit }) => {
          console.info(`Sending a text message on channel pull request review comment with content ${payload.text}`)

          const comment = await octokit.rest.pulls.createReviewComment({
            body: payload.text,
            owner,
            repo,
            pull_number: _getIntTagOrThrowException(conversation.tags, 'pullRequestNumber'),
            commit_id: _getStrTagOrThrowException(conversation.tags, 'commitBeingReviewed'),
            line: _getIntTagOrThrowException(conversation.tags, 'lineBeingReviewed'),
            in_reply_to: _getIntTagOrThrowException(conversation.tags, 'lastCommentId'),
            path: _getStrTagOrThrowException(conversation.tags, 'fileBeingReviewed'),
          })

          await ack({
            tags: {
              commentNodeId: comment.data.node_id,
              commentId: comment.data.id.toString(),
              commentUrl: comment.data.html_url,
            },
          })

          await client.updateConversation({
            id: conversation.id,
            tags: {
              lastCommentId: comment.data.id.toString(),
            } as typeof conversation.tags,
          })
        }
      ),
    },
  },
  discussion: {
    messages: {
      text: wrapChannel<'discussion'>(async ({ conversation, payload, ack, octokit }) => {
        console.info(`Sending a text message on channel discussion with content ${payload.text}`)

        const {
          addDiscussionComment: { comment },
        } = await octokit.executeGraphqlQuery('addDiscussionComment', {
          discussionNodeId: _getStrTagOrThrowException(conversation.tags, 'discussionNodeId'),
          body: payload.text,
        })

        await ack({
          tags: { commentId: comment.databaseId.toString(), commentNodeId: comment.id, commentUrl: comment.url },
        })
      }),
    },
  },
  discussionComment: {
    messages: {
      text: wrapChannel<'discussionComment'>(async ({ conversation, message, payload, ack, octokit }) => {
        console.info(`Sending a text message on channel discussion thread with content ${payload.text}`)

        const {
          addDiscussionComment: { comment },
        } = await octokit.executeGraphqlQuery('addDiscussionCommentReply', {
          discussionNodeId: _getStrTagOrThrowException(conversation.tags, 'discussionNodeId'),
          replyToCommentNodeId: _getStrTagOrThrowException(message.tags, 'commentNodeId'),
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

const _getStrTagOrThrowException = <R extends Record<string, string>>(tags: R, name: Extract<keyof R, string>) => {
  const value = tags[name]

  if (!value) {
    throw new Error(`Missing tag ${name}`)
  }

  return value
}

const _getIntTagOrThrowException = <R extends Record<string, string>>(tags: R, name: Extract<keyof R, string>) =>
  parseInt(_getStrTagOrThrowException(tags, name))
