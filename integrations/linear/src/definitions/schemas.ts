import { User } from '@linear/sdk'
import { assert, Equals } from 'tsafe/assert'
import z from 'zod'

export const targets = z.object({
  issue: z.record(z.string()).optional(),
})

type TransformDatesToStrings<T> = {
  [K in keyof T]: T[K] extends Date | undefined ? string : T[K]
}

type LinearUserProfile = Pick<
  TransformDatesToStrings<User>,
  | 'admin'
  | 'archivedAt'
  | 'avatarUrl'
  | 'createdAt'
  | 'description'
  | 'displayName'
  | 'guest'
  | 'email'
  | 'isMe'
  | 'url'
  | 'timezone'
  | 'name'
> & { linearId: string }

export const UserProfile = z.object({
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

export const LinearIds = z
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

export const LinearIssue = z.object({
  title: z.string().describe('The issue title on Linear, such as "Fix the bug'),
  number: z.number().describe('The issue number on Linear, such as "123" in XXX-123'),
  teamName: z
    .string()
    .describe('The name of the Linear team the issue currently belongs to, such as "Customer Support"'),
  teamKey: z.string().describe('The key of the Linear team the issue currently belongs to, such as "XXX" in XXX-123'),
  createdAt: z.string().datetime().describe('The ISO date the issue was created'),
  updatedAt: z.string().datetime().describe('The ISO date the issue was last updated'),
  status: z.string().describe('The issue State name (such as "In Progress"'),
  priority: z.number().describe('Priority of the issue, such as "1" for "Urgent", 0 for "No Priority"'),
  description: z
    .string()
    .optional()
    .describe('A markdown description of the issue. Images and videos are inlined using markdown links.'),
  labels: z.array(z.string()).optional().describe('Label names'),
  linearIds: LinearIds,
  userId: z.string().describe('Botpress User ID of the person who created the issue'),
  conversationId: z.string().describe('Botpress Conversation ID of the issue'),
})

assert<Equals<z.infer<typeof UserProfile>, LinearUserProfile>>()
