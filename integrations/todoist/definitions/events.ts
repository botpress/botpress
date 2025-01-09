import sdk, { z } from '@botpress/sdk'
import { Task } from './entities'

export const events = {
  taskAdded: {
    title: 'Task Added',
    description: 'A task has been added',
    schema: z.object({
      id: Task.schema.shape.id,
      content: Task.schema.shape.content,
      description: Task.schema.shape.description,
      priority: Task.schema.shape.priority,
    }),
  },
  taskPriorityChanged: {
    title: 'Task Priority Changed',
    description:
      'The priority of a task has been changed. The old priority is only available if the bot user is at the origin of the change',
    schema: z.object({
      id: Task.schema.shape.id,
      newPriority: Task.schema.shape.priority.title('New Priority'),
      oldPriority: Task.schema.shape.priority.optional().title('Old Priority'),
    }),
  },
  taskCompleted: {
    title: 'Task Completed',
    description: 'A task has been completed',
    schema: z.object({
      user_id: z.string().title('User ID').describe('The ID of the user who completed the task'),
      id: Task.schema.shape.id,
      content: Task.schema.shape.content,
      description: Task.schema.shape.description,
      priority: Task.schema.shape.priority,
    }),
  },
} as const satisfies sdk.IntegrationDefinitionProps['events']
