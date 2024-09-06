import { IntegrationDefinitionProps } from '@botpress/sdk'

export const user: IntegrationDefinitionProps['user'] = {
  tags: {
    userId: {
      title: 'User ID',
      description: 'Unique identifier of the Trello user',
    },
  },
}
