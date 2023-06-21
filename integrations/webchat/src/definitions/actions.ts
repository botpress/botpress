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
      config: z.string().describe('An config as JSON'),
    }),
  },
  output: {
    schema: z.object({}),
  },
}

const customEvent = {
  title: 'Send Custom Event',
  input: {
    schema: z.object({
      conversationId,
      event: z.string().describe('An event as JSON to send to the webchat instance'),
    }),
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
