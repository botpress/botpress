import { IntegrationDefinitionProps, messages } from '@botpress/sdk'

export const channels = {
  channel: {
    title: 'Channel',
    description: 'The channel for Asana',
    messages: {
      ...messages.defaults,
      markdown: messages.markdown,
      bloc: messages.markdownBloc,
    },
  },
} satisfies IntegrationDefinitionProps['channels']
