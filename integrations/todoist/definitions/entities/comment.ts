import { z } from '@botpress/sdk'

// documentation for Comment: https://developer.todoist.com/rest/v2/#comments

export namespace Comment {
  const _fields = {
    id: z.string().title('ID').describe('The ID of the comment'),
    taskId: z
      .string()
      .title('Task ID')
      .optional()
      .describe('The ID of the task this comment belongs to. Omitted if the comment belongs to a project.'),
    projectId: z
      .string()
      .title('Project ID')
      .optional()
      .describe('The ID of the project this comment belongs to. Omitted if the comment belongs to a task.'),
    postedAt: z.string().title('Posted At').describe('Date and time when comment was added, RFC3339 format in UTC.'),
    content: z
      .string()
      .title('Content')
      .describe('The text of the comment. This value may contain markdown-formatted text and hyperlinks.'),
  } as const

  export const schema = z.object(_fields)
  export type InferredType = z.infer<typeof schema>
}
