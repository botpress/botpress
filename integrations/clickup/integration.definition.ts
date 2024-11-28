import { IntegrationDefinition, z } from "@botpress/sdk";

export default new IntegrationDefinition({
  name: "clickup",
  version: "0.0.1",
  description: 'Create and update tasks, and add comments from your chatbot.',
  title: 'ClickUp',
  readme: 'hub.md',
  icon: "icon.svg",
  configuration: {
    schema: z.object({
      apiKey: z.string().describe("API Key for Click Up"),
      teamId: z.string().describe("Team ID to use for Click Up"),
    }),
  },
  events: {
    taskCreated: {
      schema: z.object({ id: z.string() }),
    },
    taskUpdated: {
      schema: z.object({ id: z.string() }),
    },
    taskDeleted: {
      schema: z.object({ id: z.string() }),
    },
  },

  actions: {
    createTask: {
      title: "Create A Click Up Task",
      description: "Takes a name and a list ID as an input and creates a task in Click Up in that list with that name.",
      input: {
        schema: z.object({
          listId: z.string().describe("ID of the list to create the task in"),
          name: z.string().describe("Name of the task to be created"),
          description: z.string().optional().describe("Description of the task to be created"),
          status: z.string().optional().describe("Status of the task to be created"),
          assignees: z.array(z.number()).optional().describe("IDs of the assignees of the task to be created"),
          dueDate: z.string().datetime().optional().describe("Due date of the task to be created"),
          tags: z.array(z.string()).optional().describe("Tags of the task to be created"),
        }),
      },
      output: {
        schema: z.object({
          taskId: z.string().describe("Id of the task created"),
        }),
      },
    },
    updateTask: {
      title: "Update A Click Up Task",
      description: "Takes a task ID and updates the task in Click Up with the given parameters.",
      input: {
        schema: z.object({
          taskId: z.string().describe("ID of the task to be updated"),
          name: z.string().optional().describe("New name of the task"),
          description: z.string().optional().describe("New description of the task"),
          status: z.string().optional().describe("New status of the task"),
          archived: z.boolean().optional().describe("New archived status of the task"),
          assigneesToAdd: z.array(z.number()).optional().describe("Members to add to the task"),
          assigneesToRemove: z.array(z.number()).optional().describe("Members to remove from the task"),
          dueDate: z.string().datetime().optional().describe("New due date of the task"),
        }),
      },
      output: {
        schema: z.object({
          taskId: z.string().describe("Id of the task updated"),
        }),
      },
    },
    deleteTask: {
      title: "Delete A Click Up Task",
      description: "Takes a task ID and deletes the task in Click Up.",
      input: {
        schema: z.object({
          taskId: z.string().describe("ID of the task to be deleted"),
        }),
      },
      output: {
        schema: z.object({}),
      },
    },
    getListMembers: {
      title: "Get Members of a List",
      description: "Takes a list ID and returns the members of the list.",
      input: {
        schema: z.object({
          listId: z.string().describe("ID of the list to get the members of"),
        }),
      },
      output: {
        schema: z.object({
          members: z.array(z.object({
            id: z.number().describe("ID of the member"),
            username: z.string().describe("Username of the member"),
            email: z.string().describe("Email of the member"),
          })).describe("Members of the list"),
        }),
      },
    },
  },

  channels: {
    comment: {
      messages: {
        text: {
          schema: z.object({ text: z.string().describe("Content of the comment") }),
        },
      },
      message: {
        tags: {
          id: {
            title: "Message ID",
            description: "Message ID from ClickUp",
          },
        },
      },
      conversation: {
        tags: {
          taskId: {
            title: "Task ID",
            description: "Task ID from ClickUp",
          },
        },
      },
    },
  },

  user: {
    tags: {
      id: {
        title: "User ID",
        description: "User ID from ClickUp",
      },
    },
  },
});
