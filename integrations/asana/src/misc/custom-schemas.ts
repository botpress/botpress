import { z } from '@botpress/sdk'
import { photoSchema, workspaceSchema } from './sub-schemas'

export const createTaskInputSchema = z.object({
  name: z.string().describe('The name of the task (e.g. "My Test Task")').title('Name'),
  notes: z
    .string()
    .optional()
    .describe('The description of the task (Optional) (e.g. "This is my other task created using the Asana API")')
    .title('Notes'),
  assignee: z
    .string()
    .optional()
    .default('me')
    .describe(
      'The ID of the user who will be assigned to the task or "me" to assign to the current user (Optional) (e.g. "1215207682932839") (Default: "me")'
    )
    .title('Assignee'),
  projects: z
    .string()
    .optional()
    .describe(
      'The project IDs should be strings separated by commas (Optional) (e.g. "1205199808673678, 1215207282932839").'
    )
    .title('Projects'),
  parent: z
    .string()
    .optional()
    .describe('The ID of the parent task (Optional) (e.g. "1205206556256028")')
    .title('Parent'),
  start_on: z
    .string()
    .optional()
    .describe('The start date of the task in YYYY-MM-DD format (Optional) (e.g. "2023-08-13")')
    .title('Start On'),
  due_on: z
    .string()
    .optional()
    .describe('The due date of the task without a specific time in YYYY-MM-DD format (Optional) (e.g. "2023-08-15")')
    .title('Due On'),
})

export const taskOutputSchema = z.object({
  permalink_url: z.string().describe('The permalink url').title('Permalink Url'),
})
export const createTaskOutputSchema = taskOutputSchema

export const updateTaskInputSchema = createTaskInputSchema
  .omit({
    projects: true,
    parent: true,
  })
  .extend({
    taskId: z.string().describe('Task ID to update').title('Task ID'),
    name: z.string().optional().describe('The name of the task (Optional) (e.g. "My Test Task")').title('Name'),
    assignee: z
      .string()
      .optional()
      .describe(
        'The ID of the user who will be assigned to the task or "me" to assign to the current user (Optional) (e.g. "1215207682932839")'
      )
      .title('Assignee'),
    completed: z
      .string()
      .optional()
      .describe(
        'If the task is completed, enter "true" (without quotes), otherwise it will keep its previous status. (Optional)'
      )
      .title('Completed'),
  })
export const updateTaskOutputSchema = taskOutputSchema

export const findUserInputSchema = z.object({
  userEmail: z.string().describe('User Email (e.g. "mrsomebody@example.com")').title('User Email'),
})

export const findUserOutputSchema = z
  .object({
    gid: z.string().describe('The GID of the User').title('GID'),
    name: z.string().describe('The name of the user').title('Name'),
    email: z.string().describe('The email of the user').title('Email'),
    photo: photoSchema.describe('The photo of the user').title('Photo'),
    resource_type: z.string().describe('The resource type of the user').title('Resource Type'),
    workspaces: z.array(workspaceSchema).describe('List of the workspaces').title('Workspaces'),
  })
  .partial()

export const addCommentToTaskInputSchema = z.object({
  taskId: z.string().describe('Task ID to comment').title('Task ID'),
  comment: z.string().describe('Content of the comment to be added').title('Comment'),
})

export const addCommentToTaskOutputSchema = z.object({
  text: z.string().describe('The text of the comment').title('Text'),
})
