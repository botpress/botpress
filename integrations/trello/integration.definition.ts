import { IntegrationDefinition, messages } from '@botpress/sdk'
import { TrelloConfigSchema } from 'src/schemas'
import {
  addCardCommentInputSchema,
  addCardCommentOutputSchema,
  createCardInputSchema,
  createCardOutputSchema,
  getBoardIdInputSchema,
  getBoardIdOutputSchema,
  getCardIdInputSchema,
  getCardIdOutputSchema,
  getListIdInputSchema,
  getListIdOutputSchema,
  moveCardDownInputSchema,
  moveCardDownOutputSchema,
  moveCardToListInputSchema,
  moveCardToListOutputSchema,
  moveCardUpInputSchema,
  moveCardUpOutputSchema,
} from 'src/schemas/actions'
import { webhookStateSchema } from 'src/schemas/states'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  title: 'Trello',
  version: '1.0.0',
  readme: 'hub.md',
  description:
    "Boost your chatbot's capabilities with Trello. Easily update cards, add comments, create new cards, and read board members from your chatbot",
  icon: 'icon.svg',
  actions: {
    getBoardId: {
      title: 'Get board ID by name',
      description: 'Get the unique identifier of a board by name',
      input: {
        schema: getBoardIdInputSchema,
      },
      output: {
        schema: getBoardIdOutputSchema,
      },
    },
    getListId: {
      title: 'Get list ID by name',
      description: 'Get the unique identifier of a list by name',
      input: {
        schema: getListIdInputSchema,
      },
      output: {
        schema: getListIdOutputSchema,
      },
    },
    getCardId: {
      title: 'Get card ID by name',
      description: 'Get the unique identifier of a card by name',
      input: {
        schema: getCardIdInputSchema,
      },
      output: {
        schema: getCardIdOutputSchema,
      },
    },
    createCard: {
      title: 'Create new card',
      description: 'Create a card and add it to a list',
      input: {
        schema: createCardInputSchema,
      },
      output: {
        schema: createCardOutputSchema,
      },
    },
    moveCardUp: {
      title: 'Move card up',
      description: 'Move a card n spaces up',
      input: {
        schema: moveCardUpInputSchema,
      },
      output: {
        schema: moveCardUpOutputSchema,
      },
    },
    moveCardDown: {
      title: 'Move card down',
      description: 'Move a card n spaces down',
      input: {
        schema: moveCardDownInputSchema,
      },
      output: {
        schema: moveCardDownOutputSchema,
      },
    },
    moveCardToList: {
      title: 'Move card to another list',
      description: 'Move a card to another list within the same board',
      input: {
        schema: moveCardToListInputSchema,
      },
      output: {
        schema: moveCardToListOutputSchema,
      },
    },
    addCardComment: {
      title: 'Add card comment',
      description: 'Add a new comment to a card',
      input: {
        schema: addCardCommentInputSchema,
      },
      output: {
        schema: addCardCommentOutputSchema,
      },
    },
  },
  channels: {
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
  },
  user: {
    tags: {
      userId: {
        title: 'User ID',
        description: 'Unique identifier of the Trello user',
      },
    },
  },
  configuration: {
    schema: TrelloConfigSchema,
  },
  states: {
    webhookState: {
      type: 'integration',
      schema: webhookStateSchema,
    },
  },
})
