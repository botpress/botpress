import * as sdk from '@botpress/sdk'

export const user = {
  tags: {
    id: {
      title: 'Notion User ID',
      description: 'The ID of the user on Notion.',
    },
  },
} as const satisfies sdk.IntegrationDefinitionProps['user']
