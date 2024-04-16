import { z } from '@botpress/sdk'
import { photoSchema, workspaceSchema } from './sub-schemas'

export const createTaskInputSchema = z.object({
  name: z.string().describe('The name of the task (e.g. "My Test Task")'),
  notes: z
    .string()
    .optional()
    .describe('The description of the task (Optional) (e.g. "This is my other task created using the Asana API")'),
  assignee: z
    .string()
    .optional()
    .default('me')
    .describe(
      'The ID of the user who will be assigned to the task or "me" to assign to the current user (Optional) (e.g. "1215207682932839") (Default: "me")'
    ),
  projects: z
    .string()
    .optional()
    .describe(
      'The project IDs should be strings separated by commas (Optional) (e.g. "1205199808673678, 1215207282932839").'
    ),
  parent: z.string().optional().describe('The ID of the parent task (Optional) (e.g. "1205206556256028")'),
  start_on: z
    .string()
    .optional()
    .describe('The start date of the task in YYYY-MM-DD format (Optional) (e.g. "2023-08-13")'),
  due_on: z
    .string()
    .optional()
    .describe('The due date of the task without a specific time in YYYY-MM-DD format (Optional) (e.g. "2023-08-15")'),
})

export const taskOutputSchema = z.object({ permalink_url: z.string() })
export const createTaskOutputSchema = taskOutputSchema

export const updateTaskInputSchema = createTaskInputSchema
  .omit({
    projects: true,
    parent: true,
  })
  .extend({
    taskId: z.string().describe('Task ID to update'),
    name: z.string().optional().describe('The name of the task (Optional) (e.g. "My Test Task")'),
    assignee: z
      .string()
      .optional()
      .describe(
        'The ID of the user who will be assigned to the task or "me" to assign to the current user (Optional) (e.g. "1215207682932839")'
      ),
    completed: z
      .string()
      .optional()
      .describe(
        'If the task is completed, enter "true" (without quotes), otherwise it will keep its previous status. (Optional)'
      ),
  })
export const updateTaskOutputSchema = taskOutputSchema

export const findUserInputSchema = z.object({
  userEmail: z.string().describe('User Email (e.g. "mrsomebody@example.com")'),
})

export const findUserOutputSchema = z
  .object({
    gid: z.string(),
    name: z.string(),
    email: z.string(),
    photo: photoSchema,
    resource_type: z.string(),
    workspaces: z.array(workspaceSchema),
  })
  .partial()

export const addCommentToTaskInputSchema = z.object({
  taskId: z.string().describe('Task ID to comment'),
  comment: z.string().describe('Content of the comment to be added'),
})

export const addCommentToTaskOutputSchema = z.object({
  text: z.string(),
})
