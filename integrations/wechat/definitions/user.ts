import { IntegrationDefinitionProps } from '@botpress/sdk'

export const user = {
  tags: {
    id: { title: 'ID', description: 'The ID of the user' },
  },
} as const satisfies IntegrationDefinitionProps['user']
