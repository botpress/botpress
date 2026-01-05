import { type IntegrationDefinitionProps } from '@botpress/sdk'
import { boardSchema, cardSchema, listSchema, memberSchema } from './schemas'

export const entities = {
  card: {
    title: 'Card',
    description: 'A card in a Trello list',
    schema: cardSchema,
  },
  list: {
    title: 'List',
    description: 'A list in a Trello board',
    schema: listSchema,
  },
  board: {
    title: 'Board',
    description: 'A Trello board',
    schema: boardSchema,
  },
  boardMember: {
    title: 'Board Member',
    description: 'A member of a Trello board',
    schema: memberSchema,
  },
  cardMember: {
    title: 'Card Member',
    description: 'A member assigned to a Trello card',
    schema: memberSchema,
  },
} as const satisfies IntegrationDefinitionProps['entities']
