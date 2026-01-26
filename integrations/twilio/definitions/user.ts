import { IntegrationDefinitionProps } from '@botpress/sdk'

export const user = {
  tags: {
    userPhone: {
      title: 'User Phone',
      description: 'The phone number of the user',
    },
  },
} satisfies IntegrationDefinitionProps['user']
