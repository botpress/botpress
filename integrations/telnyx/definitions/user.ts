import { IntegrationDefinitionProps } from '@botpress/sdk'

export const user = {
  tags: {
    phoneNumber: {
      title: 'Phone Number',
      description: 'The phone number of the user',
    },
  },
} satisfies IntegrationDefinitionProps['user']