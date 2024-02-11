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
          data: z.string().min(1, { message: "Must not me empty"}).describe("JSON string of data to send")
        }).describe('Input schema for sending data'),
      },
      output: {
        schema: z.object({
          response: z.array(z.any()).describe('Output schema after sending data, expecting any JSON structure')
        }).describe('Output schema after sending data'),
      }
    }
  },
});
