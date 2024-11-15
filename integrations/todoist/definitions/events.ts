import sdk, { z } from '@botpress/sdk'

export const events = {
  taskAdded: {
    title: 'Task Added',
    description: 'A task has been added',
    schema: z.object({
      id: z.string(),
      content: z.string(),
      description: z.string(),
      priority: z.number(),
    }),
  },
  taskPriorityChanged: {
    title: 'Task Priority Changed',
    description:
      'The priority of a task has been changed. The old priority is only available if the bot user is at the origin of the change',
    schema: z.object({
      id: z.string(),
      newPriority: z.number(),
      oldPriority: z.number().optional(),
    }),
  },
  taskCompleted: {
    title: 'Task Completed',
    description: 'A task has been completed',
    schema: z.object({
      id: z.string(),
      user_id: z.string(),
      content: z.string(),
      description: z.string(),
      priority: z.number(),
    }),
  },
} as const satisfies sdk.IntegrationDefinitionProps['events']
