import sdk, { z } from '@botpress/sdk'

export const configuration = {
  schema: z.object({
    apiToken: z.string().optional(),
  }),
  identifier: {
    linkTemplateScript: 'linkTemplate.vrl',
  },
} as const satisfies sdk.IntegrationDefinitionProps['configuration']

export const configurations = undefined satisfies sdk.IntegrationDefinitionProps['configurations']

export const identifier = {
  extractScript: 'extract.vrl',
} as const satisfies sdk.IntegrationDefinitionProps['identifier']
