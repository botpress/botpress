/* bplint-disable */
import { IntegrationDefinition, z } from '@botpress/sdk'

export default new IntegrationDefinition({
  name: 'clickup',
  title: 'ClickUp',
  version: '0.0.1',
  description: 'Create and update tasks, and add comments from your chatbot.',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      apiKey: z.string().describe('API Key for Click Up'),
      teamId: z.string().describe('Team ID to use for Click Up'),
    }),
  },
  events: {
    taskCreated: {
      title: 'Task Created',
      description: 'Triggered when a task is created',
      schema: z.object({ id: z.string() }),
    },
    taskUpdated: {
      title: 'Task Updated',
      description: 'Triggered when a task is updated',
      schema: z.object({ id: z.string() }),
    },
    taskDeleted: {
      title: 'Task Deleted',
      description: 'Triggered when a task is deleted',
      schema: z.object({ id: z.string() }),
    },
  },

  actions: {
    createTask: {
      title: 'Create a task',
      description: 'Create a new task in a list',
      input: {
        schema: z.object({
          listId: z.string().describe('ID of the list to create the task in'),
          name: z.string().describe('Name of the task to be created'),
          description: z.string().optional().describe('Description of the task to be created'),
          status: z.string().optional().describe('Status of the task to be created'),
          assignees: z.array(z.number()).optional().describe('IDs of the assignees of the task to be created'),
          dueDate: z.string().datetime().optional().describe('Due date of the task to be created'),
          tags: z.array(z.string()).optional().describe('Tags of the task to be created'),
        }),
      },
      output: {
        schema: z.object({
          taskId: z.string().describe('Id of the task created'),
        }),
      },
    },
    updateTask: {
      title: 'Update a task',
      description: 'Update the details of a task',
      input: {
        schema: z.object({
          taskId: z.string().describe('ID of the task to be updated'),
          name: z.string().optional().describe('New name of the task'),
          description: z.string().optional().describe('New description of the task'),
          status: z.string().optional().describe('New status of the task'),
          archived: z.boolean().optional().describe('New archived status of the task'),
          assigneesToAdd: z.array(z.number()).optional().describe('Members to add to the task'),
          assigneesToRemove: z.array(z.number()).optional().describe('Members to remove from the task'),
          dueDate: z.string().datetime().optional().describe('New due date of the task'),
        }),
      },
      output: {
        schema: z.object({
          taskId: z.string().describe('Id of the task updated'),
        }),
      },
    },
    deleteTask: {
      title: 'Delete a task',
      description: 'Delete a task',
      input: {
        schema: z.object({
          taskId: z.string().describe('ID of the task to be deleted'),
        }),
      },
      output: {
        schema: z.object({}),
      },
    },
    getListMembers: {
      title: 'Get members of a list',
      description: 'Get all the members of a list',
      input: {
        schema: z.object({
          listId: z.string().describe('ID of the list to get the members of'),
        }),
      },
      output: {
        schema: z.object({
          members: z
            .array(
              z.object({
                id: z.number().describe('ID of the member'),
                username: z.string().describe('Username of the member'),
                email: z.string().describe('Email of the member'),
              })
            )
            .describe('Members of the list'),
        }),
      },
    },
  },

  channels: {
    comment: {
      title: 'Comment',
      description: 'Comments on a task',
      messages: {
        text: {
          schema: z.object({ text: z.string().describe('Content of the comment') }),
        },
      },
      message: {
        tags: {
          id: {
            title: 'Message ID',
            description: 'Message ID from ClickUp',
          },
        },
      },
      conversation: {
        tags: {
          taskId: {
            title: 'Task ID',
            description: 'Task ID from ClickUp',
          },
        },
      },
    },
  },

  user: {
    tags: {
      id: {
        title: 'User ID',
        description: 'User ID from ClickUp',
      },
    },
  },
})
