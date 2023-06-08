import type { Client, Conversation } from '@botpress/client'
import type { AckFunction } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import {
  Comment,
  Issue,
  IssueLabel,
  LinearClient,
  LinearWebhooks,
  LINEAR_WEBHOOK_SIGNATURE_HEADER,
  LINEAR_WEBHOOK_TS_FIELD,
} from '@linear/sdk'
import queryString from 'query-string'
import { LinearOauthClient } from './linear'
import { Integration, secrets } from '.botpress'
import type { Card } from '.botpress/implementation/channels/channel/card'

sentryHelpers.init({
  dsn: secrets.SENTRY_DSN,
  environment: secrets.SENTRY_ENVIRONMENT,
  release: secrets.SENTRY_RELEASE,
})

const log = console

const linearOauthClient = new LinearOauthClient()

const integration = new Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    // Issues
    listIssues: async ({ ctx, input, client }) => {
      const linearClient = await getLinearClient(client, ctx.integrationId)
      const issuesResp = await linearClient.issues(input)
      return {
        issues: issuesResp.nodes.map(toReturnedIssue),
      }
    },
    getIssue: async ({ ctx, client, input: { issueId } }) => {
      const linearClient = await getLinearClient(client, ctx.integrationId)
      const issue = await linearClient.issue(issueId)
      return toReturnedIssue(issue)
    },
    createIssue: async ({ ctx, input, client }) => {
      const linearClient = await getLinearClient(client, ctx.integrationId)
      const { issue: issueFetch, ...rest } = await linearClient.createIssue({
        ...input,
        slaBreachesAt: stringToDate(input.slaBreachesAt),
      })
      const issue = await issueFetch
      return issue ? { issue: toReturnedIssue(issue), ...rest } : rest
    },
    updateIssue: async ({ ctx, client, input: { issueId, ...input } }) => {
      const linearClient = await getLinearClient(client, ctx.integrationId)
      const { issue: issueFetch, ...rest } = await linearClient.updateIssue(issueId, {
        ...input,
        slaBreachesAt: stringToDate(input.slaBreachesAt),
      })
      const issue = await issueFetch
      return issue ? { issue: toReturnedIssue(issue), ...rest } : rest
    },
    deleteIssue: async ({ ctx, input, client }) => {
      const linearClient = await getLinearClient(client, ctx.integrationId)
      return await linearClient.deleteIssue(input.id)
    },

    // Comments
    listComments: async ({ ctx, input, client }) => {
      const linearClient = await getLinearClient(client, ctx.integrationId)
      const commentsResp = await linearClient.comments(input)
      return {
        comments: commentsResp.nodes.map(toReturnedComment),
      }
    },
    getComment: async ({ ctx, client, input: { commentId } }) => {
      const linearClient = await getLinearClient(client, ctx.integrationId)
      const comment = await linearClient.comment(commentId)
      return toReturnedComment(comment)
    },
    createComment: async ({ ctx, client, input }) => {
      const linearClient = await getLinearClient(client, ctx.integrationId)
      const { comment: commentFetch, ...rest } = await linearClient.createComment(input)
      const comment = await commentFetch
      return comment ? { comment: toReturnedComment(comment), ...rest } : rest
    },
    updateComment: async ({ ctx, client, input: { commentId, ...input } }) => {
      const linearClient = await getLinearClient(client, ctx.integrationId)
      const { comment: commentFetch, ...rest } = await linearClient.updateComment(commentId, input)
      const comment = await commentFetch
      return comment ? { comment: toReturnedComment(comment), ...rest } : rest
    },
    deleteComment: async ({ ctx, input, client }) => {
      const linearClient = await getLinearClient(client, ctx.integrationId)
      return linearClient.deleteComment(input.id)
    },
    // Issue Labels
    listIssueLabels: async ({ ctx, client, input }) => {
      const linearClient = await getLinearClient(client, ctx.integrationId)
      const issueLabelsResp = await linearClient.issueLabels(input)
      return {
        issueLabels: issueLabelsResp.nodes.map(toReturnedIssueLabel),
      }
    },
    getIssueLabel: async ({ ctx, client, input: { issueLabelId } }) => {
      const linearClient = await getLinearClient(client, ctx.integrationId)
      const issueLabel = await linearClient.issueLabel(issueLabelId)
      return toReturnedIssueLabel(issueLabel)
    },
    createIssueLabel: async ({ ctx, client, input }) => {
      const linearClient = await getLinearClient(client, ctx.integrationId)
      const { issueLabel: issueLabelFetch, ...rest } = await linearClient.createIssueLabel(input)
      const issueLabel = await issueLabelFetch
      return issueLabel ? { issueLabel: toReturnedIssueLabel(issueLabel), ...rest } : rest
    },
    updateIssueLabel: async ({ ctx, client, input: { issueLabelId, ...input } }) => {
      const linearClient = await getLinearClient(client, ctx.integrationId)
      const { issueLabel: issueLabelFetch, ...rest } = await linearClient.updateIssueLabel(issueLabelId, input)
      const issueLabel = await issueLabelFetch
      return issueLabel ? { issueLabel: toReturnedIssueLabel(issueLabel), ...rest } : rest
    },
    deleteIssueLabel: async ({ ctx, input, client }) => {
      const linearClient = await getLinearClient(client, ctx.integrationId)
      return linearClient.deleteIssueLabel(input.id)
    },
    // Others
    createReaction: async ({ ctx, input, client }) => {
      const linearClient = await getLinearClient(client, ctx.integrationId)
      const { reaction, ...rest } = await linearClient.createReaction(input)
      return {
        reaction: {
          id: reaction.id,
          emoji: reaction.emoji,
          createdAt: reaction.createdAt.toISOString(),
          updatedAt: reaction.updatedAt.toISOString(),
          archivedAt: reaction.archivedAt?.toISOString(),
        },
        ...rest,
      }
    },
    deleteReaction: async ({ ctx, input, client }) => {
      const linearClient = await getLinearClient(client, ctx.integrationId)
      return linearClient.deleteReaction(input.id)
    },
  },
  channels: {
    channel: {
      messages: {
        text: ({ payload, ...props }) => createComment({ ...props, content: payload.text }),
        image: ({ payload, ...props }) => createComment({ ...props, content: payload.imageUrl }),
        markdown: ({ payload, ...props }) => createComment({ ...props, content: payload.markdown }),
        audio: ({ payload, ...props }) => createComment({ ...props, content: payload.audioUrl }),
        video: ({ payload, ...props }) => createComment({ ...props, content: payload.videoUrl }),
        file: ({ payload, ...props }) => createComment({ ...props, content: payload.fileUrl }),
        location: ({ payload, ...props }) =>
          createComment({ ...props, content: `${payload.latitude},${payload.longitude}` }),
        card: ({ payload, ...props }) => createComment({ ...props, content: getCardContent(payload) }),
        carousel: async ({ payload, ...props }) => {
          await Promise.all(payload.items.map((item) => createComment({ ...props, content: getCardContent(item) })))
        },
        dropdown: ({ payload, ...props }) => createComment({ ...props, content: payload.text }),
        choice: ({ payload, ...props }) => createComment({ ...props, content: payload.text }),
      },
    },
  },
  handler: async ({ req, client, ctx }) => {
    log.info('Handler received request')

    if (req.path === '/oauth') {
      const query = queryString.parse(req.query)
      const code = query.code

      if (typeof code !== 'string') {
        throw new Error('Handler received an empty code')
      }

      const { accessToken, expiresAt } = await linearOauthClient.getAccessToken(code)

      await client.setState({
        type: 'integration',
        name: 'credentials',
        id: ctx.integrationId,
        payload: {
          accessToken,
          expiresAt,
        },
      })

      const linearClient = new LinearClient({ accessToken })
      const organization = await linearClient.organization
      await client.configureIntegration({ identifier: organization.id })

      return {}
    }

    if (!req.body) {
      log.warn('Handler received an empty body')
      return
    }

    const linearEvent = JSON.parse(req.body)

    const webhookSignatureHeader = req.headers[LINEAR_WEBHOOK_SIGNATURE_HEADER]
    if (!webhookSignatureHeader) {
      return
    }

    // Verify the request, it will throw an error in case of not coming from linear
    const webhook = new LinearWebhooks(secrets.WEBHOOK_SIGNING_SECRET)
    webhook.verify(Buffer.from(req.body), webhookSignatureHeader, linearEvent[LINEAR_WEBHOOK_TS_FIELD])

    await client.createEvent({
      type: `linear:${linearEvent.type.toLowerCase()}`,
      payload: linearEvent,
    })

    if (linearEvent.action !== 'create') {
      log.info("Handler didn't receive 'create' event")
      return
    }

    let conversationId: string
    let userId: string
    let content: string | undefined
    switch (linearEvent.type) {
      case 'Issue':
        conversationId = linearEvent.data.id
        content = linearEvent.data.description
        userId = linearEvent.data.creatorId
        break
      case 'Comment':
        conversationId = linearEvent.data.issueId
        content = linearEvent.data.body
        userId = linearEvent.data.userId
        break
      default:
        log.info("'Handler received object type not an 'issue' or 'comment'")
        return
    }

    if (!userId) {
      // This event was created by the integration itself we don't want to create a message
      return
    }

    if (!conversationId) {
      throw new Error('Handler received an empty issue id')
    }

    const { conversation } = await client.getOrCreateConversation({
      channel: 'channel',
      tags: {
        'linear:id': `${conversationId}`,
      },
    })

    const { user } = await client.getOrCreateUser({
      tags: {
        'linear:id': `${userId}`,
      },
    })

    const messageId = linearEvent.data.id

    if (!messageId) {
      throw new Error('Handler received an empty message id')
    }

    await client.createMessage({
      tags: { 'linear:id': `${messageId}` },
      type: 'text',
      userId: user.id,
      conversationId: conversation.id,
      payload: { text: content },
    })

    return {}
  },
})

export default sentryHelpers.wrapIntegration(integration)

async function createComment({ ctx, conversation, ack, content }: any) {
  const linearClient = new LinearClient({ apiKey: ctx.configuration.apiKey })
  const issueId = getIssueId(conversation)
  const res = await linearClient.createComment({ issueId, body: content })
  const comment = await res.comment
  if (!comment) {
    return
  }
  await ackMessage(comment.id, ack)
}

function getCardContent(card: Card) {
  return `*${card.title}*${card.subtitle ? '\n' + card.subtitle : ''}`
}

function getIssueId(conversation: Conversation): string {
  const issueId = conversation.tags['linear:id']

  if (!issueId) {
    throw Error(`No issue found for conversation ${conversation.id}`)
  }

  return issueId
}

async function ackMessage(commentId: string, ack: AckFunction) {
  await ack({ tags: { 'linear:id': commentId } })
}

function getLinearClient(client: Client, integrationId: string) {
  return linearOauthClient.getLinearClient(client, integrationId)
}

function dateToString(obj: Date | undefined) {
  return obj ? obj.toISOString() : undefined
}

function stringToDate(str: string | undefined) {
  return str ? new Date(str) : undefined
}

function toReturnedIssue(issue: Issue) {
  return {
    ...issue,
    createdAt: issue.createdAt.toISOString(),
    updatedAt: issue.updatedAt.toISOString(),
    archivedAt: dateToString(issue.archivedAt),
    canceledAt: dateToString(issue.canceledAt),
    completedAt: dateToString(issue.completedAt),
    autoArchivedAt: dateToString(issue.autoArchivedAt),
    autoClosedAt: dateToString(issue.autoClosedAt),
    snoozedUntilAt: dateToString(issue.snoozedUntilAt),
    startedAt: dateToString(issue.startedAt),
    startedTriageAt: dateToString(issue.startedTriageAt),
    triagedAt: dateToString(issue.triagedAt),
  }
}

function toReturnedComment(comment: Comment) {
  return {
    ...comment,
    archivedAt: dateToString(comment.archivedAt),
    editedAt: dateToString(comment.editedAt),
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  }
}

function toReturnedIssueLabel(issueLabel: IssueLabel) {
  return {
    ...issueLabel,
    archivedAt: dateToString(issueLabel.archivedAt),
    createdAt: issueLabel.createdAt.toISOString(),
    updatedAt: issueLabel.updatedAt.toISOString(),
  }
}
