import { IntegrationDefinitionProps, z } from '@botpress/sdk'

export const configuration = {
  schema: z.object({
    awsRegion: z
      .string()
      .min(1)
      .describe('AWS region where your Amazon Connect instance is hosted (e.g., us-east-1)'),
    instanceId: z
      .string()
      .min(1)
      .describe('Amazon Connect instance ID (found in the Amazon Connect console)'),
    contactFlowId: z
      .string()
      .min(1)
      .describe('Contact flow ID for bot interactions'),
    accessKeyId: z
      .string()
      .min(1)
      .describe('AWS IAM access key ID with Amazon Connect permissions'),
    secretAccessKey: z
      .string()
      .min(1)
      .describe('AWS IAM secret access key'),
    webhookUrl: z
      .string()
      .url()
      .optional()
      .describe('Botpress webhook URL for receiving messages (automatically configured)'),
    hitlContactFlowId: z
      .string()
      .optional()
      .describe('Contact flow ID for HITL (human agent handoff)'),
    defaultQueue: z
      .string()
      .optional()
      .describe('Default queue ID for routing HITL sessions'),
    botName: z
      .string()
      .optional()
      .describe('Display name for the bot in Amazon Connect'),
    botAvatarUrl: z
      .string()
      .url()
      .optional()
      .describe('Avatar URL for the bot'),
  }),
} satisfies IntegrationDefinitionProps['configuration']
