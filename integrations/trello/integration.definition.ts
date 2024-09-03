import { z, IntegrationDefinition, messages } from '@botpress/sdk'
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
    createCard: {
      title: 'Create new card',
      description: 'Create a card and add it to a list',
      input: {
        schema: z.object({
          listName: z.string().describe('Name of the list in which to insert the new card'),
          cardName: z.string().describe('Name of the new card'),
          cardBody: z.string().optional().describe('Body text of the new card'),
        }),
      },
      output: {
        schema: z.object({
          message: z.string(),
        }),
      },
    },
    moveCardUp: {
      title: 'Move card up',
      description: 'Move a card n spaces up',
      input: {
        schema: z.object({
          listName: z.string().describe('Name of the list in which to move the card'),
          cardName: z.string().describe('Name of the card to move'),
          moveUpByNSpaces: z
            .number()
            .min(1)
            .describe('Number of spaces by which to move the card up')
            .optional()
            .default(1),
        }),
      },
      output: {
        schema: z.object({
          message: z.string(),
        }),
      },
    },
    moveCardDown: {
      title: 'Move card down',
      description: 'Move a card n spaces down',
      input: {
        schema: z.object({
          listName: z.string().describe('Name of the list in which to move the card'),
          cardName: z.string().describe('Name of the card to move'),
          moveDownByNSpaces: z
            .number()
            .min(1)
            .describe('Number of spaces by which to move the card down')
            .optional()
            .default(1),
        }),
      },
      output: {
        schema: z.object({
          message: z.string(),
        }),
      },
    },
    moveCardToList: {
      title: 'Move card to another list',
      description: 'Move a card to another list within the same board',
      input: {
        schema: z.object({
          currentListName: z.string().describe('Name of the list from which the card will be moved'),
          cardName: z.string().describe('Name of the card to move'),
          newListName: z.string().describe('Name of the new list in which the card will be moved'),
        }),
      },
      output: {
        schema: z.object({
          message: z.string(),
        }),
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
    schema: z.object({
      trelloApiKey: z.string().describe('Can be obtained by creating an application on Trello').secret(),
      trelloApiToken: z.string().describe('Can be obtained by granting access to the application on Trello').secret(),
      trelloBoardName: z.string().describe('Display name of the board on Trello'),
    }),
  },
  states: {
    webhookState: {
      type: 'integration',
      schema: z.object({
        trelloWebhookId: z
          .string()
          .or(z.null())
          .describe('Unique id of the webhook that is created upon integration registration')
          .default(null),
      }),
    },
  },
})
