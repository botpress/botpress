import { IntegrationDefinitionProps } from '@botpress/sdk'
import z from 'zod'

const captureTrackEvent = {
  title: 'track event',
  description: 'Log an track event',
  input: {
    schema: z.object({
      name: z.string().describe('Name of the track event (e.g. "retrieve-info")'),
      properties: z.string().optional().describe('JSON string for properties of the track event'),
    }),
    ui: {},
  },
  output: {
    schema: z.object({
      success: z.boolean(),
    }),
  },
}

const captureTraceData = {
  title: 'Log trace data',
  description: 'Log trace data (user message / assistant message)',
  input: {
    schema: z.object({
      conversationId: z.string().describe('The Botpress conversation ID to assign to the trace'),
      role: z.string().describe('Role of sender ("user" | "assistant")'),
      content: z.string().describe('Content of the message (e.g. "Hello, how are you?")'),
      metadata: z.string().optional().describe('JSON string for metadata of the message'),
    }),
  },
  output: {
    schema: z.object({
      success: z.boolean(),
    }),
  },
}

const openTrace = {
  title: 'Open trace',
  description: 'Open a trace',
  input: {
    schema: z.object({
      conversationId: z.string().describe('The Botpress conversation ID to assign to the trace'),
      metadata: z.string().optional().describe('JSON string for metadata of the trace'),
    }),
  },
  output: {
    schema: z.object({
      success: z.boolean(),
    }),
  },
}

export const actions = {
  captureTrackEvent,
  captureTraceData,
  openTrace,
} satisfies IntegrationDefinitionProps['actions']
