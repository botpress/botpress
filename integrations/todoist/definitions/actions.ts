import sdk, { z } from '@botpress/sdk'

export const actions = {
  changeTaskPriority: {
    title: 'Change Task Priority',
    description: 'Change the priority of a task',
    input: {
      schema: z.object({
        taskId: z.string(),
        priority: z.number(),
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
        name: z.string(),
      }),
    },
    output: {
      schema: z.object({
        taskId: z.string().nullable(),
      }),
    },
  },
  getProjectId: {
    title: 'Get Project ID',
    description: 'Get the ID of the project',
    input: {
      schema: z.object({
        name: z.string(),
      }),
    },
    output: {
      schema: z.object({
        projectId: z.string().nullable(),
      }),
    },
  },
} as const satisfies sdk.IntegrationDefinitionProps['actions']
