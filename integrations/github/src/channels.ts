import { ChannelInjections, wrapChannelAndInjectOctokit } from './misc/channel-wrapper'
import { AckFunction, Channels } from './misc/types'

export default {
  pullRequest: {
    messages: {
      text: wrapChannelAndInjectOctokit('pullRequest', {
        async channel({ conversation, payload, ack, owner, repo, octokit }) {
          await _createIssueComment({
            issueNumber: +_getTagOrThrowException(conversation.tags, 'pullRequestNumber'),
            commentBody: payload.text,
            ack,
            owner,
            repo,
            octokit,
          })
        },
      }),
    },
  },
  issue: {
    messages: {
      text: wrapChannelAndInjectOctokit('issue', {
        async channel({ conversation, payload, ack, owner, repo, octokit }) {
          console.info(`Sending a text message on channel issue with content ${payload.text}`)

          await _createIssueComment({
            issueNumber: +_getTagOrThrowException(conversation.tags, 'issueNumber'),
            commentBody: payload.text,
            ack,
            owner,
            repo,
            octokit,
          })
        },
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
            pull_number: +getTagOrThrowException(conversation.tags, 'pullRequestNumber'),
            commit_id: getTagOrThrowException(conversation.tags, 'commitBeingReviewed'),
            line: +getTagOrThrowException(conversation.tags, 'lineBeingReviewed'),
            in_reply_to: +getTagOrThrowException(conversation.tags, 'lastCommentId'),
            path: getTagOrThrowException(conversation.tags, 'fileBeingReviewed'),
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
      text: wrapChannelAndInjectOctokit('discussion', {
        async channel({ conversation, payload, ack, octokit }) {
          const {
            addDiscussionComment: { comment },
          } = await octokit.executeGraphqlQuery('addDiscussionComment', {
            discussionNodeId: _getTagOrThrowException(conversation.tags, 'discussionNodeId'),
            body: payload.text,
          })

          await ack({
            tags: { commentId: comment.databaseId.toString(), commentNodeId: comment.id, commentUrl: comment.url },
          })
        },
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
          discussionNodeId: getTagOrThrowException(conversation.tags, 'discussionNodeId'),
          replyToCommentNodeId: getTagOrThrowException(message.tags, 'commentNodeId'),
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
}: { issueNumber: number; commentBody: string; ack: AckFunction } & ChannelInjections) => {
  const { data } = await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: commentBody,
  })

  await ack({ tags: { commentNodeId: data.node_id, commentId: data.id.toString(), commentUrl: data.html_url } })
}

const _getTagOrThrowException = <R extends Record<string, string>>(tags: R, name: Extract<keyof R, string>) => {
  const value = tags[name]

  if (!value) {
    throw new Error(`Missing tag ${name}`)
  }

  return value
}
