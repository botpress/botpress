import { IntegrationDefinitionProps } from '@botpress/sdk'
import z from 'zod'

const conversationId = z
  .string()
  .describe('The conversation id of the webchat instance. Usually {{event.conversationId}}')

const getUserData = {
  title: 'Get User Data',
  description:
    "Get the user's information that was provided when the webchat is initialized with the property \"userData\", for example: window.botpressWebChat.init({ userData: { name: 'John Doe' } })",
  input: {
    schema: z.object({
      userId: z.string().uuid().describe('The ID of the user. Usually you can access it using {{event.userId}}'),
    }),
    ui: {
      userId: { title: 'User ID', examples: ['{{event.userId}}'] },
    },
  },
  output: {
    schema: z.object({
      userData: z.record(z.string()).optional(),
    }),
  },
}

const showWebchat = {
  title: 'Show Webchat',
  input: {
    schema: z.object({
      conversationId,
    }),
  },
  output: {
    schema: z.object({}),
  },
}

const hideWebchat = {
  title: 'Hide Webchat',
  input: {
    schema: z.object({
      conversationId,
    }),
  },
  output: {
    schema: z.object({}),
  },
}

const toggleWebchat = {
  title: 'Toggle Webchat',
  input: {
    schema: z.object({
      conversationId,
    }),
  },
  output: {
    schema: z.object({}),
  },
}

const configWebchat = {
  title: 'Configure Webchat',
  description: 'Update the webchat configuration during a conversation',
  input: {
    schema: z.object({
      conversationId,
      config: z
        .string()
        .describe(
          'A JSON string representing the new configuration. You can use {{JSON.stringify(workflow.someVariable)}} to convert an object to JSON'
        ),
    }),
    ui: {
      conversationId: { title: 'Conversation ID', examples: ['{{event.conversationId}}'] },
      config: {
        title: 'JSON Configuration',
        examples: ['{ "emailAddress": "some@mail.com" }', '{{JSON.stringify(workflow.someVariable)}}'],
      },
    },
  },
  output: {
    schema: z.object({}),
  },
}

const customEvent = {
  title: 'Send Custom Event',
  description: 'Use this action to send a custom event to the webchat. You must handle this event on your web page.',
  input: {
    schema: z.object({
      conversationId,
      event: z.string().describe('An event as JSON to send to the webchat instance'),
    }),
    ui: {
      conversationId: { title: 'Conversation ID', examples: ['{{event.conversationId}}'] },
      event: { title: 'JSON Payload', examples: ['{ "emailAddress": "some@mail.com" }'] },
    },
  },
  output: {
    schema: z.object({}),
  },
}

export const actions = {
  getUserData,
  showWebchat,
  hideWebchat,
  toggleWebchat,
  configWebchat,
  customEvent,
} satisfies IntegrationDefinitionProps['actions']
