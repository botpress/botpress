import * as sdk from '@botpress/sdk'

export const user = {
  tags: {
    id: {},
  },
} as const satisfies sdk.IntegrationDefinitionProps['user']
