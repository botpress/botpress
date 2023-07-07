import { IntegrationDefinitionProps } from '@botpress/sdk'
import z from 'zod'
import { UserProfile } from '../definitions/schemas'

const channels = ['issue'] as const

export type Target = {
  displayName: string
  tags: { [key: string]: string }
  channel: (typeof channels)[number]
}

const findTarget = {
  title: 'Find Target',
  description: 'Find a target on Linear',
  input: {
    schema: z.object({
      query: z.string().min(2),
      channel: z.enum(['issue']),
    }),
  },
  output: {
    schema: z.object({
      targets: z.array(
        z.object({
          displayName: z.string(),
          tags: z.record(z.string()),
          channel: z.enum(['issue']),
        })
      ),
    }),
  },
}

const issueSchema = z.object({
  id: z.string(),
  number: z.number(),
  identifier: z.string(),
  title: z.string(),
  description: z.string().optional(),
  priority: z.number(),
  url: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

const getIssue = {
  title: 'Get Issue',
  input: {
    schema: z.object({
      issueId: z.string().describe('The issue ID on Linear. Ex: {{event.payload.linearIds.issueId}}'),
    }),
  },
  output: {
    schema: issueSchema,
  },
}

const getUser = {
  title: 'Get User Profile',
  description: 'Get a user profile from Linear',
  input: {
    schema: z.object({
      linearUserId: z.string().describe("The user's ID on Linear. Ex: {{event.payload.linearIds.creatorId}}"),
    }),
  },
  output: {
    schema: UserProfile,
  },
}

const updateIssue = {
  title: 'Update Issue',
  input: {
    schema: z.object({
      issueId: z.string(),
      priority: z.number().optional().describe('0 = none, 1 = urgent, 2 = high, 3 = medium, 4 = low'),
      teamName: z.string().optional().describe('Type a name to change the assigned team of the issue'),
      labels: z
        .array(z.string())
        .optional()
        .default(['type/dx'])
        .describe('One or multiple labels to assign to this issue'),
      project: z.string().optional().describe('A project to associate to this issue'),
    }),
    ui: {
      issueId: {
        title: 'Issue ID',
        examples: ['{{event.payload.id}}'],
      },
      priority: {
        title: 'Priority',
      },
      teamName: {
        title: 'Move to team...',
      },
      labels: {
        title: 'Set labels',
      },
      project: {
        title: 'Associate to project...',
      },
    },
  },
  output: {
    schema: z.object({
      issue: issueSchema.optional(),
    }),
  },
}

export const actions = {
  findTarget,
  getIssue,
  getUser,
  updateIssue,
} satisfies IntegrationDefinitionProps['actions']
