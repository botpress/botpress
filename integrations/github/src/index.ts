import type { Conversation } from '@botpress/client'
import type { AckFunction } from '@botpress/sdk'

import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { verify as verifyWebhook } from '@octokit/webhooks-methods'
import type { WebhookEvent } from '@octokit/webhooks-types'

import { Octokit } from 'octokit'
import { parseGithubEvent } from './helpers'
import { Integration, secrets } from '.botpress'

sentryHelpers.init({
  dsn: secrets.SENTRY_DSN,
  environment: secrets.SENTRY_ENVIRONMENT,
  release: secrets.SENTRY_RELEASE,
})

const log = console
const GITHUB_SIGNATURE_HEADER = 'x-hub-signature-256'

const integration = new Integration({
  register: async ({ ctx, webhookUrl, client }) => {
    const { owner, repo, token } = ctx.configuration
    const octokit = new Octokit({ auth: token })
    const secret = `secret-${Math.random()}`
    const webhook = await octokit.rest.repos.createWebhook({
      owner,
      repo,
      config: { url: webhookUrl, secret, content_type: 'json' },
      events: ['pull_request', 'issue_comment', 'issue', 'discussion', 'discussion_comment'],
    })
    const botUserId = (await octokit.rest.users.getAuthenticated()).data.id
    await client.setState({
      type: 'integration',
      name: 'configuration',
      id: ctx.integrationId,
      payload: { webhookSecret: secret, webhookId: webhook.data.id, botUserId },
    })
  },
  unregister: async ({ ctx, client }) => {
    const { owner, repo, token } = ctx.configuration
    const octokit = new Octokit({ auth: token })
    const { state } = await client.getState({
      type: 'integration',
      name: 'configuration',
      id: ctx.integrationId,
    })
    await octokit.rest.repos.deleteWebhook({ owner, repo, hook_id: state.payload.webhookId })
  },
  actions: {},
  channels: {
    pullRequest: {
      messages: {
        text: async ({ ctx, conversation, payload, ack }) => {
          log.info(`Sending a text message on channel pull request with content ${payload.text}`)
          const { owner, repo, token } = ctx.configuration
          const octokit = new Octokit({ auth: token })

          const prNumber = getConversationNumber(conversation)
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
          log.info(`Sending a text message on channel discussion with content ${payload.text}`)
          const { owner, repo, token } = ctx.configuration
          const octokit = new Octokit({ auth: token })

          const discussionNumber = getConversationNumber(conversation)

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
          log.info(`Sending a text message on channel issue with content ${payload.text}`)
          const { owner, repo, token } = ctx.configuration
          const octokit = new Octokit({ auth: token })

          const issueNumber = getConversationNumber(conversation)
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
  },
  handler: async ({ req, ctx, client }) => {
    const signature = req.headers[GITHUB_SIGNATURE_HEADER]
    const { body } = req
    if (!(body && signature)) {
      log.warn('Invalid request')
      return
    }

    const { state } = await client.getState({
      type: 'integration',
      name: 'configuration',
      id: ctx.integrationId,
    })

    const verified = await verifyWebhook(state.payload.webhookSecret, body, signature)
    if (!verified) {
      log.warn('Non verified request')
      return
    }

    const event: WebhookEvent = JSON.parse(body)
    const parsed = parseGithubEvent(event)

    if (!parsed) {
      log.info('Unsupported github event')
      return
    }

    const { content, messageId, conversationId, userId, channel } = parsed

    if (!(userId && messageId)) {
      throw new Error('Handler received an empty data')
    }

    if (state.payload.botUserId === userId) {
      log.info('The message is coming from the same bot user id')
      return
    }

    const [{ conversation }, { user }] = await Promise.all([
      client.getOrCreateConversation({
        channel,
        tags: { 'github:number': `${conversationId}` },
      }),
      client.getOrCreateUser({ tags: { 'github:id': `${userId}` } }),
    ])

    await client.createMessage({
      tags: { 'github:id': `${messageId}` },
      type: 'text',
      userId: user.id,
      conversationId: conversation.id,
      payload: { text: content },
    })
  },
})

export default sentryHelpers.wrapIntegration(integration)

function getConversationNumber(conversation: Conversation): number {
  const number = conversation.tags['github:number']

  if (!number) {
    throw Error(`No chat found for conversation ${conversation.id}`)
  }

  return Number(number)
}

async function ackMessage(messageId: number, ack: AckFunction) {
  await ack({ tags: { 'github:id': `${messageId}` } })
}
