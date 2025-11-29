import { IntegrationDefinitionProps } from '@botpress/sdk'

export const user = {
  tags: {
    id: {
      title: 'ID',
      description: 'Teams user ID',
    },
    email: {
      title: 'Email',
      description: 'Email address',
    },
  },
} satisfies IntegrationDefinitionProps['user']
