import z from 'zod'
import {
  AvatarUrlsSchema,
  SimpleListWrapperApplicationRoleSchema,
  SimpleListWrapperGroupNameSchema,
} from './sub-schemas'

export const newIssueInputSchema = z.object({
  summary: z
    .string()
    .describe(
      'The summary of the issue, providing a brief description (e.g. My Issue)'
    ),
  description: z
    .string()
    .optional()
    .describe(
      'The detailed description of the issue (Optional) (e.g. This is an example issue for demonstration purposes)'
    ),
  issueType: z
    .string()
    .describe(
      'The type of the issue (e.g. "Bug", "Task", "Subtask", "Story" or "Epic")'
    ),
  projectKey: z
    .string()
    .describe('The key of the project to which the issue belongs (e.g. TEST)'),
  parentKey: z
    .string()
    .optional()
    .describe(
      'The key of the parent issue, if this issue is a sub-task (Optional) (e.g. TEST-1)'
    ),
  assigneeId: z
    .string()
    .optional()
    .describe(
      'The ID of the user to whom the issue is assigned (Optional) (e.g. 5b10ac8d82e05b22cc7d4ef5)'
    ),
})

export const newIssueOutputSchema = z.object({
  issueKey: z.string(),
})

export const findUserInputSchema = z.object({
  accountId: z
    .string()
    .describe(
      'Account ID (e.g. 5b10a2844c20165700ede21g or 747474:a1b2c3d4-e5f6-7890-a1b2-c3d4e5f67890)'
    ),
})

export const findUserOutputSchema = z.object({
  self: z.string().optional(),
  key: z.string().optional(),
  accountId: z.string(),
  accountType: z.string().optional(),
  name: z.string().optional(),
  emailAddress: z.string().optional(),
  avatarUrls: AvatarUrlsSchema.optional(),
  displayName: z.string().optional(),
  active: z.boolean(),
  timeZone: z.string().optional(),
  locale: z.string().optional(),
  groups: SimpleListWrapperGroupNameSchema.optional(),
  applicationRoles: SimpleListWrapperApplicationRoleSchema.optional(),
  expand: z.string().optional(),
})

export const updateIssueInputSchema = newIssueInputSchema.partial().extend({
  issueKey: z.string().describe('The Key for Issue (e.g. TASK-185)'),
  issueType: z
    .string()
    .describe(
      'The type of the issue (e.g. "Bug", "Task", "Subtask", "Story" or "Epic")'
    ),
})

export const updateIssueOutputSchema = newIssueOutputSchema

export const addCommentToIssueInputSchema = z.object({
  issueKey: z.string().describe('The Key for Issue (e.g. TASK-185)'),
  body: z.string().describe('Message content in text format'),
})

export const addCommentToIssueOutputSchema = z.object({
  id: z.string().optional(),
})

export const findAllUsersInputSchema = z.object({
  startAt: z
    .number()
    .optional()
    .describe('The index of the first item to return (Default: 0) (Optional)'),
  maxResults: z
    .number()
    .optional()
    .describe('The maximum number of items to return (Default: 50) (Optional)'),
})

export const findAllUsersOutputSchema = z.object({
  users: z.array(findUserOutputSchema),
})
