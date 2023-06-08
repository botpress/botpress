import { IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { z } from 'zod'
import {
  commonRes,
  comment,
  commentInput,
  commonDelete,
  issue,
  issueInput,
  issueLabel,
  issueLabelInput,
  listSchema,
} from './src/common'

export default new IntegrationDefinition({
  name: 'linear',
  version: '0.2.0',
  title: 'Linear',
  description: 'This integration allows your bot to interact with Linear.',
  icon: 'icon.svg',
  readme: 'readme.md',
  configuration: {
    schema: z.object({}),
  },
  secrets: ['CLIENT_ID', 'CLIENT_SECRET', 'WEBHOOK_SIGNING_SECRET', ...sentryHelpers.COMMON_SECRET_NAMES],
  channels: {
    channel: {
      messages: messages.defaults,
      tags: {
        messages: ['id'],
        conversations: ['id'],
      },
    },
  },
  tags: {
    users: ['id'],
  },
  actions: {
    createIssue: {
      input: {
        schema: issueInput,
      },
      output: {
        schema: commonRes.extend({
          issue: issue.optional(),
        }),
      },
    },
    createReaction: {
      input: {
        schema: z.object({
          commentId: z.string().optional(),
          emoji: z.string().optional(),
          id: z.string().optional(),
          projectUpdateId: z.string().optional(),
        }),
      },
      output: {
        schema: commonRes.extend({
          reaction: z.object({
            id: z.string(),
            emoji: z.string(),
            createdAt: z.string(),
            updatedAt: z.string(),
            archivedAt: z.string().optional(),
          }),
        }),
      },
    },
    updateIssue: {
      input: {
        schema: issueInput.extend({ issueId: z.string() }),
      },
      output: {
        schema: commonRes.extend({
          issue: issue.optional(),
        }),
      },
    },
    getIssue: {
      input: {
        schema: z.object({ issueId: z.string() }),
      },
      output: {
        schema: issue,
      },
    },
    listIssues: {
      input: {
        schema: listSchema,
      },
      output: {
        schema: z.object({
          issues: z.array(issue),
        }),
      },
    },
    createComment: {
      input: {
        schema: commentInput,
      },
      output: {
        schema: commonRes.extend({
          comment: comment.optional(),
        }),
      },
    },
    updateComment: {
      input: {
        schema: commentInput.extend({ commentId: z.string() }),
      },
      output: {
        schema: commonRes.extend({
          comment: comment.optional(),
        }),
      },
    },
    getComment: {
      input: {
        schema: z.object({ commentId: z.string() }),
      },
      output: {
        schema: comment,
      },
    },
    listComments: {
      input: {
        schema: listSchema,
      },
      output: {
        schema: z.object({
          comments: z.array(comment),
        }),
      },
    },
    createIssueLabel: {
      input: {
        schema: issueLabelInput,
      },
      output: {
        schema: commonRes.extend({
          issueLabel: issueLabel.optional(),
        }),
      },
    },
    updateIssueLabel: {
      input: {
        schema: issueLabelInput.extend({ issueLabelId: z.string() }),
      },
      output: {
        schema: commonRes.extend({
          issueLabel: issueLabel.optional(),
        }),
      },
    },
    getIssueLabel: {
      input: {
        schema: z.object({ issueLabelId: z.string() }),
      },
      output: {
        schema: issueLabel,
      },
    },
    listIssueLabels: {
      input: {
        schema: listSchema,
      },
      output: {
        schema: z.object({
          issueLabels: z.array(issueLabel),
        }),
      },
    },
    deleteReaction: commonDelete,
    deleteIssue: commonDelete,
    deleteComment: commonDelete,
    deleteIssueLabel: commonDelete,
  },
  events: {},
  states: {
    credentials: {
      type: 'integration',
      schema: z.object({
        accessToken: z.string(),
        expiresAt: z.string(),
      }),
    },
  },
})
