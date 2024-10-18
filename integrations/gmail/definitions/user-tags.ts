import * as sdk from '@botpress/sdk'

export const user = {
  tags: {
    id: { title: 'Email address', description: 'The email address of the user' },
  },
} as const satisfies sdk.IntegrationDefinitionProps['user']
