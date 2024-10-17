import * as sdk from '@botpress/sdk'
const { z } = sdk

export const configuration = {
  identifier: {
    linkTemplateScript: 'linkTemplate.vrl',
  },
  schema: z.object({}),
} as const satisfies sdk.IntegrationDefinitionProps['configuration']

export const identifier = {
  extractScript: 'extract.vrl',
} as const satisfies sdk.IntegrationDefinitionProps['identifier']
