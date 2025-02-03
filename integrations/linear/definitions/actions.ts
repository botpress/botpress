import { z, IntegrationDefinitionProps, ActionDefinition } from '@botpress/sdk'
import { linearIdsSchema, userProfileSchema, issueSchema } from './schemas'

const _channels = ['issue'] as const

export type Target = {
  displayName: string
  tags: { [key: string]: string }
  channel: (typeof _channels)[number]
}

const findTarget = {
  title: 'Find Target',
  description: 'Find a target on Linear',
  input: {
    schema: z.object({
      query: z.string().min(2).title('Search query').describe('Issue title, description, or number'),
      channel: z.enum(['issue']).title('Channel').describe('The channel to search in'),
    }),
  },
  output: {
    schema: z.object({
      targets: z
        .array(
          z.object({
            displayName: z.string().title('Display Name').describe('The name of the issue'),
            tags: z.record(z.string()).title('Tags').describe('The tags applied to the issue'),
            channel: z.enum(['issue']).title('Channel').describe('The channel of the search result'),
          })
        )
        .title('Results')
        .describe('The list of issues found'),
    }),
  },
} as const satisfies ActionDefinition

const getIssue = {
  title: 'Get Issue',
  description: 'Get an issue by its ID',
  input: {
    schema: z.object({
      issueId: z.string().title('Issue ID').describe('The issue ID on Linear. Ex: {{event.payload.linearIds.issueId}}'),
    }),
  },
  output: {
    schema: issueSchema.title('Issue').describe('The issue found'),
  },
} as const satisfies ActionDefinition

const listIssues = {
  title: 'List Issues',
  description: 'List issues from Linear',
  input: {
    schema: z.object({
      count: z.number().optional().default(10).title('Fetch Amount').describe('The number of issues to return'),
      startCursor: z.string().optional().title('Start Cursor').describe('The cursor to start from'),
      teamId: z.string().optional().title('Team ID').describe('The team ID to filter by'),
      startDate: z.string().optional().title('Start Date').describe('Ignore issues created before this date'),
    }),
  },
  output: {
    schema: z.object({
      issues: z
        .array(issueSchema.extend({ linearIds: linearIdsSchema }))
        .title('Issues')
        .describe('The list of matching issues'),
      nextCursor: z.string().optional().title('Next Cursor').describe('The cursor to fetch the next page'),
    }),
  },
} as const satisfies ActionDefinition

const userSchema = z.object({
  id: z.string().title('ID').describe('The user ID on Linear'),
  email: z.string().title('Email').describe("The user's email address"),
  name: z.string().title('Name').describe("The user's nickname"),
  displayName: z.string().title('Display Name').describe("The user's display name"),
  avatarUrl: z.string().optional().title('Avatar URL').describe('The URL of the user avatar'),
  description: z
    .string()
    .optional()
    .title('Description')
    .describe("The user's description, such as their title or bio"),
  lastSeen: z.string().optional().title('Last Seen').describe('The last time the user was seen'),
  updatedAt: z.date().title('Updated At').describe('The last time the user was updated'),
})

const listUsers = {
  title: 'List Users',
  description: 'List users from Linear',
  input: {
    schema: z.object({
      count: z.number().optional().default(10).title('Fetch Amount').describe('The number of users to return'),
      startCursor: z.string().optional().title('Start Cursor').describe('The cursor to start from'),
    }),
  },
  output: {
    schema: z.object({
      users: z.array(userSchema).title('Users').describe('The list of matching users'),
      nextCursor: z.string().optional().title('Next Cursor').describe('The cursor to fetch the next page'),
    }),
  },
} as const satisfies ActionDefinition

const listTeams = {
  title: 'List Teams',
  description: 'List teams from Linear',
  input: {
    schema: z.object({}),
  },
  output: {
    schema: z.object({
      teams: z
        .array(
          z.object({
            id: z.string().title('ID').describe('The unique identifier of the entity'),
            name: z.string().title('Name').describe("The team's name"),
            description: z.string().optional().title('Description').describe("The team's description"),
            icon: z.string().optional().title('Icon').describe('The icon of the team'),
          })
        )
        .title('Teams')
        .describe('The list of teams'),
    }),
  },
} as const satisfies ActionDefinition

const markAsDuplicate = {
  title: 'Mark Issue as Duplicate',
  description: 'Mark an issue as a duplicate of another',
  input: {
    schema: z.object({
      issueId: z.string().title('Issue ID').describe('The issue ID on Linear. Ex: {{event.payload.linearIds.issueId}}'),
      relatedIssueId: z.string().title('Related Issue ID').describe('The ID of the existing issue on Linear'),
    }),
  },
  output: {
    schema: z.object({}),
  },
} as const satisfies ActionDefinition

const getUser = {
  title: 'Get User Profile',
  description: 'Get a user profile from Linear',
  input: {
    schema: z.object({
      linearUserId: z
        .string()
        .title('User ID')
        .describe("The user's ID on Linear. Ex: {{event.payload.linearIds.creatorId}}"),
    }),
  },
  output: {
    schema: userProfileSchema.title('User').describe('The user profile'),
  },
} as const satisfies ActionDefinition

const updateIssue = {
  title: 'Update Issue',
  description: 'Update an issue on Linear',
  input: {
    schema: z.object({
      issueId: z.string().title('Issue ID').describe('The issue ID on Linear. Example: {{event.payload.id}}'),
      priority: z.number().optional().title('Priority').describe('0 = none, 1 = urgent, 2 = high, 3 = medium, 4 = low'),
      teamName: z
        .string()
        .optional()
        .title('Move to team...')
        .describe('Type a name to change the assigned team of the issue'),
      labels: z
        .array(z.string())
        .optional()
        .title('Set labels')
        .describe('One or multiple labels to assign to this issue'),
      project: z.string().optional().title('Associate to project...').describe('A project to associate to this issue'),
    }),
  },
  output: {
    schema: z.object({
      issue: issueSchema.optional().title('Issue').describe('The updated issue'),
    }),
  },
} as const satisfies ActionDefinition

const createIssue = {
  title: 'Create Issue',
  description: 'Create an issue on Linear',
  input: {
    schema: z.object({
      title: z.string().min(1).title('Title').describe("The issue's title"),
      description: z.string().title('Description').describe('The content of the issue'),
      priority: z.number().optional().title('Priority').describe('0 = none, 1 = urgent, 2 = high, 3 = medium, 4 = low'),
      teamName: z.string().title('Team Name').describe('Name of the team to assign the issue to'),
      labels: z.array(z.string()).optional().title('Labels').describe('One or multiple labels to assign to this issue'),
      project: z.string().optional().title('Project').describe('A project to associate to this issue'),
    }),
  },
  output: {
    schema: z.object({
      issue: issueSchema.title('Issue').describe('The created issue'),
    }),
  },
} as const satisfies ActionDefinition

const deleteIssue = {
  title: 'Delete Issue',
  description: 'Delete an issue on Linear',
  input: {
    schema: z.object({
      id: z.string().title('Issue ID').describe('The issue ID on Linear. Ex: {{event.payload.linearIds.issueId}}'),
    }),
  },
  output: {
    schema: z.object({}),
  },
} as const satisfies ActionDefinition

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
  deleteIssue,
} as const satisfies IntegrationDefinitionProps['actions']
