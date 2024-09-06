import { IntegrationDefinitionProps, messages } from '@botpress/sdk'

export const channels = {
  cardComments: {
    messages: {
      text: messages.defaults.text,
    },
    message: {
      tags: {
        commentId: {
          title: 'Comment ID',
          description: 'unique identifier of the comment',
        },
      },
    },
    conversation: {
      tags: {
        cardId: {
          title: 'Card ID',
          description: 'unique identifier of the card',
        },
        cardName: {
          title: 'Card name',
          description: 'display name of the card',
        },
        listId: {
          title: 'List ID',
          description: 'unique identifier of the list',
        },
        listName: {
          title: 'Card ID',
          description: 'display name of the list',
        },
        lastCommentId: {
          title: 'Last comment ID',
          description: 'unique identifier of the last comment sent by the integration in this conversation',
        },
      },
    },
  },
} as const satisfies NonNullable<IntegrationDefinitionProps['channels']>
