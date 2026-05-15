import { IntegrationDefinitionProps, messages } from '@botpress/sdk'

export const channels = {
  issueComments: {
    title: 'Issue Comments',
    description: 'Outbound comments on Jira issues',
    messages: {
      text: messages.defaults.text,
    },
    message: {
      tags: {
        commentId: {
          title: 'Comment ID',
          description: 'Jira identifier of the created issue comment',
        },
      },
    },
    conversation: {
      tags: {
        issueKey: {
          title: 'Issue Key',
          description: 'Jira issue key that text messages in this conversation are posted to',
        },
      },
    },
  },
} satisfies NonNullable<IntegrationDefinitionProps['channels']>
