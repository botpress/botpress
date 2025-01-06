import sdk, { z } from '@botpress/sdk'
import { Task, Project } from './entities'

export const actions = {
  changeTaskPriority: {
    title: 'Change Task Priority',
    description: 'Change the priority of a task',
    input: {
      schema: z.object({
        taskId: Task.schema.shape.id,
        priority: Task.schema.shape.priority,
      }),
    },
    output: {
      schema: z.object({}),
    },
  },
  getTaskId: {
    title: 'Get Task ID',
    description: 'Get the ID of the first task matching the given name',
    input: {
      schema: z.object({
        name: z.string().title('Name').describe('The name of the task to search for'),
        // NOTE: this actually refers to the `content` property of the Task
        //       entity: the `name` property does not exist
      }),
    },
    output: {
      schema: z.object({
        taskId: Task.schema.shape.id.nullable(),
      }),
    },
  },
  getProjectId: {
    title: 'Get Project ID',
    description: 'Get the ID of the project',
    input: {
      schema: z.object({
        name: Project.schema.shape.name,
      }),
    },
    output: {
      schema: z.object({
        projectId: Project.schema.shape.id.nullable(),
      }),
    },
  },
} as const satisfies sdk.IntegrationDefinitionProps['actions']
