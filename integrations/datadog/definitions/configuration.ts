import { default as sdk, z } from '@botpress/sdk'

export const configuration = {
  schema: z.object({
    apiKey: z
      .string()
      .min(1)
      .title('API Key')
      .describe('Your Datadog API key. You can find it in Datadog under Organization Settings > API Keys.'),
    appKey: z
      .string()
      .min(1)
      .title('Application Key')
      .describe('Your Datadog Application key. You can find it in Datadog under Organization Settings > Application Keys.'),
    site: z
      .string()
      .default('datadoghq.com')
      .title('Datadog Site')
      .optional()
      .describe('Your Datadog site (e.g., datadoghq.com, us3.datadoghq.com, us5.datadoghq.com, ap1.datadoghq.com, eu.datadoghq.com).'),
  }),
  identifier: undefined,
} as const satisfies sdk.IntegrationDefinitionProps['configuration']

export const identifier = undefined satisfies sdk.IntegrationDefinitionProps['identifier']

export const configurations = {} as const satisfies sdk.IntegrationDefinitionProps['configurations']

