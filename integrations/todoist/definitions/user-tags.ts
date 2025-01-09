import sdk from '@botpress/sdk'

export const user = {
  tags: {
    id: {
      title: 'Todoist User ID',
      description: 'The unique ID of the user on Todoist',
    },
  },
} as const satisfies sdk.IntegrationDefinitionProps['user']
