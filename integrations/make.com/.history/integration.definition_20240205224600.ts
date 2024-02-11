import { IntegrationDefinition, messages } from '@botpress/sdk';
import { z } from 'zod';

const INTEGRATION_NAME = "makecom";

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: '0.2.0',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      webhookUrl: z.string().url().describe('Make.com webhook URL'),
    }).describe('Configuration schema for Make.com Integration'),
  },
  channels: {
    channel: {
      messages: { ...messages.defaults },
    },
  },
  actions: {
    sendData: {
      input: {
        schema: z.object({
          data: z.string().describe("JSON string of data to send")
        }).describe('Input schema for sending data'),
      },
      output: {
        schema: z.object({
          response: z.array(z.any()).describe('Output schema after sending data, expecting any JSON structure'),
          error: z.object({
            message: z.string().optional().describe('Error message describing what went wrong'),
            type: z.string().optional().describe('Type of error (e.g., "ValidationError", "NetworkError")'),
            details: z.any().optional().describe('Additional details about the error, such as request IDs or validation issues')
          }).optional().describe('Error information if the action failed')
        }).describe('Output schema after sending data'),
      }
    }
  },
});
