import { z } from '@botpress/sdk'

export const targets = z.object({
  issue: z.record(z.string()).optional(),
})

export const userProfileSchema = z.object({
  linearId: z.string().describe('Linear User ID'),
  admin: z.boolean().describe('Indicates if the user is an admin of the organization'),
  archivedAt: z.string().datetime().optional().describe('Date when the user was archived'),
  avatarUrl: z.string().url().optional(),
  createdAt: z.string().datetime().describe('Date when the user was created'),
  description: z.string().optional().describe('A short description of the user, either its title or bio'),
  displayName: z.string().describe("The user's display (nick) name. Unique within each organization"),
  guest: z
    .boolean()
    .describe('Whether the user is a guest in the workspace and limited to accessing a subset of teams'),
  email: z.string(),
  isMe: z.boolean().describe('Whether the user is the currently authenticated user'),
  url: z.string().describe("User's profile URL"),
  timezone: z.string().optional().describe('The local timezone of the user'),
  name: z.string().describe("The user's full name"),
})

export const linearIdsSchema = z
  .object({
    creatorId: z.string().optional().describe('The internal Linear User ID of the user who created the issue'),
    labelIds: z.array(z.string()).optional().describe('The internal Linear Label IDs associated with the issue'),
    issueId: z.string().describe('The internal Linear Issue ID'),
    teamId: z.string().optional().describe('The internal Linear Team ID'),
    projectId: z.string().optional().describe('The internal Linear Project ID'),
    assigneeId: z.string().optional().describe('The internal Linear Assignee ID'),
    subscriberIds: z.array(z.string()).optional().describe('The internal Linear Subscriber User IDs'),
  })
  .optional()
  .describe('The Linear IDs of the referenced entities')

export const issueSchema = z.object({
  id: z.string().describe('The issue ID on Linear'),
  identifier: z.string().describe("Issue's human readable identifier (e.g. XXX-123)"),
  number: z.number().describe('The issue number on Linear, such as "123" in XXX-123'),
  title: z.string().describe('The issue title on Linear'),
  description: z
    .string()
    .optional()
    .describe('A markdown description of the issue. Images and videos are inlined using markdown links.'),
  priority: z.number().describe('Priority of the issue, such as "1" for "Urgent", 0 for "No Priority"'),
  estimate: z.number().optional().describe('The estimate of the issue in points'),
  url: z.string().describe('The URL of the issue on Linear'),
  createdAt: z.string().datetime().describe('The ISO date the issue was created'),
  updatedAt: z.string().datetime().describe('The ISO date the issue was last updated'),
})
