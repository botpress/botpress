import { Octokit } from 'octokit'
import { Channels } from './misc/types'
import { ackMessage, getConversationId } from './misc/utils'

export default {
  pullRequest: {
    messages: {
      text: async ({ ctx, conversation, payload, ack }) => {
        console.info(`Sending a text message on channel pull request with content ${payload.text}`)
        const { owner, repo, token } = ctx.configuration
        const octokit = new Octokit({ auth: token })

        const prNumber = getConversationId(conversation)
        const comment = await octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number: prNumber,
          body: payload.text,
        })
        await ackMessage(comment.data.id, ack)
      },
    },
  },
  discussion: {
    messages: {
      text: async ({ ctx, conversation, payload, ack }) => {
        console.info(`Sending a text message on channel discussion with content ${payload.text}`)
        const { owner, repo, token } = ctx.configuration
        const octokit = new Octokit({ auth: token })

        const discussionNumber = getConversationId(conversation)

        // Currently, there is no rest API to create a repo discussion comment
        const {
          repository: {
            discussion: { id: discussionId },
          },
        } = await octokit.graphql<{ repository: { discussion: { id: string } } }>(
          `query ($owner:String!,$repo:String!,$discussionNumber:Int!){
            repository(owner:$owner,name:$repo) {
              discussion(number:$discussionNumber) {
                id
              }
            }
          }`,
          {
            owner,
            repo,
            discussionNumber,
          }
        )
        const {
          addDiscussionComment: {
            comment: { databaseId },
          },
        } = await octokit.graphql<{ addDiscussionComment: { comment: { databaseId: number } } }>(
          `mutation ($discussionId: ID!, $body: String!) {
            addDiscussionComment(input: {discussionId: $discussionId, body: $body}) {
              comment {
                databaseId
              }
            }
          }`,
          {
            discussionId,
            body: payload.text,
          }
        )

        await ackMessage(databaseId, ack)
      },
    },
  },
  issue: {
    messages: {
      text: async ({ ctx, conversation, payload, ack }) => {
        console.info(`Sending a text message on channel issue with content ${payload.text}`)
        const { owner, repo, token } = ctx.configuration
        const octokit = new Octokit({ auth: token })

        const issueNumber = getConversationId(conversation)
        const comment = await octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number: issueNumber,
          body: payload.text,
        })
        await ackMessage(comment.data.id, ack)
      },
    },
  },
} satisfies Channels
