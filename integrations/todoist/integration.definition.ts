import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import creatable from './bp_modules/creatable'

const ItemDefinition = z.object({
  id: z.string(),
  user_id: z.string(),
  content: z.string(),
  description: z.string(),
  priority: z.number(),
})

export default new IntegrationDefinition({
  name: 'todoist',
  version: '0.0.2',
  readme: 'README.md',
  icon: 'icon.svg',
  channels: {
    comments: {
      messages: {
        text: messages.defaults.text,
      },
      conversation: {
        tags: {
          id: {
            title: 'Task ID',
            description: 'The ID of the task',
          },
        },
      },
      message: {
        tags: {
          id: {
            title: 'Comment ID',
            description: 'The ID of the comment',
          },
        },
      },
    },
  },
  user: {
    tags: {
      id: {
        title: 'User ID',
        description: 'The ID of a user',
      },
    },
  },
  actions: {
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
  },
  events: {
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
      schema: ItemDefinition,
    },
  },
  configuration: {
    schema: z.object({
      apiToken: z.string().optional(),
    }),
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
    },
  },
  states: {
    credentials: {
      type: 'integration',
      schema: z.object({
        accessToken: z.string(),
      }),
    },
    configuration: {
      type: 'integration',
      schema: z.object({
        botUserId: z.string().optional(),
      }),
    },
  },
  secrets: {
    CLIENT_ID: {
      optional: false,
      description: 'Client ID in the App Management page of your Todoist app',
    },
    CLIENT_SECRET: {
      optional: false,
      description: 'Client Secret in the App Management page of your Todoist app',
    },
  },
  identifier: {
    extractScript: 'extract.vrl',
  },
  entities: {
    task: {
      schema: z.object({
        id: z.string(),
        content: z.string(),
        description: z.string(),
        priority: z.number(),
        projectId: z.string(),
        parentTaskId: z.string().optional(),
      }),
    },
  },
}).extend(creatable, ({ task }) => ({ item: task }))
