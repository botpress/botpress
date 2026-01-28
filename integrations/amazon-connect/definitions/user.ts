import { IntegrationDefinitionProps } from '@botpress/sdk'

export const user = {
  tags: {
    id: {
      title: 'Participant ID',
      description: 'Amazon Connect participant ID',
    },
    contactId: {
      title: 'Contact ID',
      description: 'Current Amazon Connect contact ID',
    },
  },
} satisfies IntegrationDefinitionProps['user']
