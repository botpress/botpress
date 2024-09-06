import { IntegrationDefinitionProps } from '@botpress/sdk'

export const user = {
  tags: {
    userId: {
      title: 'User ID',
      description: 'Unique identifier of the Trello user',
    },
  },
} as const satisfies NonNullable<IntegrationDefinitionProps['user']>
