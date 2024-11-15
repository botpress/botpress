import sdk from '@botpress/sdk'

export const user = {
  tags: {
    id: {
      title: 'User ID',
      description: 'The ID of a user',
    },
  },
} as const satisfies sdk.IntegrationDefinitionProps['user']
