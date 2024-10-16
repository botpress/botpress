import { ChannelProps, wrapChannelAndInjectOctokit } from './misc/channel-wrapper'
import { Channels } from './misc/types'

export default {
  pullRequest: {
    messages: {
      text: wrapChannelAndInjectOctokit({ channelName: 'pullRequest', messageType: 'text' }, async (props) => {
        await _createIssueComment({
          issueNumber: _getIntTagOrThrowException(props.conversation.tags, 'pullRequestNumber'),
          commentBody: props.payload.text,
          ...props,
        })
      }),
    },
  },
  issue: {
    messages: {
      text: wrapChannelAndInjectOctokit({ channelName: 'issue', messageType: 'text' }, async (props) => {
        console.info(`Sending a text message on channel issue with content ${props.payload.text}`)

        await _createIssueComment({
          issueNumber: _getIntTagOrThrowException(props.conversation.tags, 'issueNumber'),
          commentBody: props.payload.text,
          ...props,
        })
      }),
    },
  },
  pullRequestReviewComment: {
    messages: {
      text: wrapChannelAndInjectOctokit(
        { channelName: 'pullRequestReviewComment', messageType: 'text' },
        async ({ conversation, payload, ack, client, owner, repo, octokit }) => {
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
      text: wrapChannelAndInjectOctokit(
        { channelName: 'discussion', messageType: 'text' },
        async ({ conversation, payload, ack, octokit }) => {
          const {
            addDiscussionComment: { comment },
          } = await octokit.executeGraphqlQuery('addDiscussionComment', {
            discussionNodeId: _getStrTagOrThrowException(conversation.tags, 'discussionNodeId'),
            body: payload.text,
          })

          await ack({
            tags: { commentId: comment.databaseId.toString(), commentNodeId: comment.id, commentUrl: comment.url },
          })
        }
      ),
    },
  },
  discussionComment: {
    messages: {
      text: wrapChannelAndInjectOctokit(
        { channelName: 'discussionComment', messageType: 'text' },
        async ({ conversation, message, payload, ack, octokit }) => {
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
        }
      ),
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
}: { issueNumber: number; commentBody: string } & ChannelProps) => {
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
