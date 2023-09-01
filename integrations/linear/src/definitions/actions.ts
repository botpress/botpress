import { IntegrationDefinitionProps } from '@botpress/sdk'
import z from 'zod'
import { LinearIds, UserProfile } from '../definitions/schemas'

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

const listIssues = {
  title: 'List Issues',
  input: {
    schema: z.object({
      count: z.number().optional().default(10).describe('The number of issues to return'),
      startCursor: z.string().optional().describe('The cursor to start from'),
      teamId: z.string().optional().describe('The team ID to filter by'),
      startDate: z.string().optional().describe('Ignore issues created before this date'),
    }),
  },
  output: {
    schema: z.object({
      issues: z.array(issueSchema.extend({ linearIds: LinearIds })),
      nextCursor: z.string().optional(),
    }),
  },
}

const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().optional(),
  description: z.string().optional(),
  lastSeen: z.string().optional(),
  updatedAt: z.date(),
})

const listUsers = {
  title: 'List Users',
  input: {
    schema: z.object({
      count: z.number().optional().default(10).describe('The number of users to return'),
      startCursor: z.string().optional().describe('The cursor to start from'),
    }),
  },
  output: {
    schema: z.object({
      users: z.array(userSchema),
      nextCursor: z.string().optional(),
    }),
  },
}

const listTeams = {
  title: 'List Teams',
  input: {
    schema: z.object({}),
  },
  output: {
    schema: z.object({
      teams: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          description: z.string().optional(),
          icon: z.string().optional(),
        })
      ),
    }),
  },
}

const markAsDuplicate = {
  title: 'Mark Issue as Duplicate',
  input: {
    schema: z.object({
      issueId: z.string().describe('The issue ID on Linear. Ex: {{event.payload.linearIds.issueId}}'),
      relatedIssueId: z.string().describe('The ID of the existing issue on Linear'),
    }),
  },
  output: {
    schema: z.object({}),
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

const createIssue = {
  title: 'Create Issue',
  input: {
    schema: z.object({
      title: z.string().min(1),
      description: z.string().describe('The content of the issue'),
      priority: z.number().optional().describe('0 = none, 1 = urgent, 2 = high, 3 = medium, 4 = low'),
      teamName: z.string().describe('Name of the team to assign the issue to'),
      labels: z.array(z.string()).optional().describe('One or multiple labels to assign to this issue'),
      project: z.string().optional().describe('A project to associate to this issue'),
    }),
    ui: {},
  },
  output: {
    schema: z.object({
      issue: issueSchema,
    }),
  },
} satisfies NonNullable<IntegrationDefinitionProps['actions']>[string]

export const actions = {
  findTarget,
  listIssues,
  listTeams,
  listUsers,
  markAsDuplicate,
  getIssue,
  getUser,
  updateIssue,
  createIssue,
} satisfies IntegrationDefinitionProps['actions']
