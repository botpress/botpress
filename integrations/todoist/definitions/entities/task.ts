import { z } from '@botpress/sdk'

/**
 * Note: `item` is an old term used by Todoist to refer to tasks in their old
 * Sync API. While the REST API uses the term `task` and sends us Task entities,
 * we still receive Item entities in webhook events. Todoist is currently in the
 * process of phasing out the Item entity in favor of the Task entity, but for
 * now we must manually do some mapping between the two, since we only want to
 * expose the Task entity to the user.
 */

// documentation for Task: https://developer.todoist.com/rest/v2/#tasks
// documentation for Item: https://developer.todoist.com/sync/v9/#items

export namespace Task {
  const _fields = {
    id: z.string().title('ID').describe('The ID of the task'),
    projectId: z.string().title('Project ID').describe('The ID of the project this task belongs to (read-only).'),
    sectionId: z
      .string()
      .title('Section ID')
      .optional()
      .describe('The ID of the section this task belongs to (read-only). Omitted if the task is not in a section.'),
    content: z
      .string()
      .title('Content')
      .describe('The text of the task. This value may contain markdown-formatted text and hyperlinks.'),
    description: z
      .string()
      .title('Description')
      .describe('A description for the task. This value may contain markdown-formatted text and hyperlinks.'),
    isCompleted: z.boolean().title('Is Completed?').describe('Whether the task is completed or not.'),
    labels: z
      .array(z.string().title('Label Name').describe('The name of a label associated with the task.'))
      .title('Labels')
      .describe(
        'The labels associated with the task. This is a list of names that may represent either personal or shared labels.'
      ),
    parentTaskId: z
      .string()
      .title('Parent Task ID')
      .optional()
      .describe('The ID of the parent task (read-only). Omitted if the task has no parent task.'),
    positionWithinParent: z
      .number()
      .title('Position Within Parent')
      .describe(
        "Numerical index indicating task's order within its parent (task, or project for top-level tasks) (read-only)."
      ),
    priority: z
      .number()
      .title('Priority')
      .min(1)
      .max(4)
      .describe('Task priority from 1 (urgent) to 4 (lowest, default value).'),
    dueDate: z
      .string()
      .title('Due Date')
      .optional()
      .describe('The due date of the task. Omitted if the task has no due date.'),
    isRecurringDueDate: z
      .boolean()
      .title('Is Recurring Due Date?')
      .describe('Whether the due date is recurring or not.'),
    webUrl: z
      .string()
      .title('Web URL')
      .describe('URL to access this task in the Todoist web or mobile applications (read-only).'),
    numberOfComments: z
      .number()
      .title('Number of Comments')
      .nonnegative()
      .describe('The number of comments associated with the task (read-only).'),
    createdAt: z.string().title('Created At').describe('The date when the task was created (read-only).'),
    createdBy: z.string().title('Created By ID').describe('The ID of the user who created the task (read-only).'),
    assignee: z
      .string()
      .title('Assignee ID')
      .optional()
      .describe('The ID of the user to whom the task is assigned. Omitted if the task is not assigned.'),
    assigner: z
      .string()
      .title('Assigner ID')
      .optional()
      .describe('The ID of the user who assigned the task (read-only). Omitted if the task is not assigned.'),
    duration: z
      .object({
        amount: z.number().title('Amount').positive().describe('The amount of time.'),
        unit: z.enum(['minute', 'day']).title('Unit').describe('The unit of time.'),
      })
      .title('Duration')
      .optional()
      .describe('The duration of the task. Omitted if the task has no duration.'),
  } as const

  export const schema = z.object(_fields)
  export type InferredType = z.infer<typeof schema>
}
